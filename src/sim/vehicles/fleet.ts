import {
  driveFactors,
  leaseConfig,
  vehicleModelValues,
  type ModelValues,
} from '../../config/vehicles';
import type { VehicleDrive, VehicleModel } from '../../content/vehicleTypes';
import type { EventBus } from '../core/eventBus';
import { addOneMonth } from '../core/gameTime';
import { addNotice } from '../events/notices';
import { book } from '../finance/ledger';
import type { GameState } from '../state/gameState';
import { ENTRANCE } from '../world/roadNetwork';
import type { Truck } from './types';

/** Werte eines Typs mit Antrieb: Elektro teurer im Kauf, billiger je km (T2.5). */
export function modelValues(model: VehicleModel, drive: VehicleDrive): ModelValues {
  const base = vehicleModelValues[model];
  const f = driveFactors[drive];
  return {
    ...base,
    priceCents: Math.round((base.priceCents * f.pricePercent) / 100),
    costPerKmCents: Math.round((base.costPerKmCents * f.perKmPercent) / 100),
  };
}

export function valuesOf(t: Truck): ModelValues {
  return modelValues(t.model, t.drive);
}

export function leaseMonthlyCents(priceCents: number): number {
  return Math.round((priceCents * leaseConfig.monthlyPermille) / 1000);
}

function addMonths(tick: number, months: number): number {
  let t = tick;
  for (let i = 0; i < months; i++) t = addOneMonth(t);
  return t;
}

/** Ganze Monate seit dem Kauf (für den Restwert). */
function monthsSince(from: number, to: number): number {
  let months = 0;
  for (let t = addOneMonth(from); t <= to; t = addOneMonth(t)) months += 1;
  return months;
}

/** Restwert beim Verkauf eines gekauften Fahrzeugs. */
export function residualCents(state: GameState, t: Truck): number {
  const c = leaseConfig;
  const permille = Math.max(
    c.residualMinPercent * 10,
    c.residualStartPercent * 10 -
      monthsSince(t.boughtTick, state.tick) * c.residualLossPerMonthPermille,
  );
  return Math.round((t.priceCents * permille) / 1000);
}

/** Strafe bei vorzeitiger Rückgabe: bis zu `earlyReturnPenaltyMonths` noch offene Raten. */
export function returnPenaltyCents(t: Truck): number {
  if (!t.lease) return 0;
  let open = 0;
  for (let p = t.lease.nextPaymentTick; p < t.lease.endTick; p = addOneMonth(p)) open += 1;
  return Math.min(open, leaseConfig.earlyReturnPenaltyMonths) * t.lease.monthlyCents;
}

/** Was das Abgeben bringt (positiv, Verkauf) bzw. kostet (negativ, Leasing-Rückgabe). */
export function disposalCents(state: GameState, t: Truck): number {
  return t.lease ? -returnPenaltyCents(t) : residualCents(state, t);
}

/** Erste Kosten beim Anschaffen: Kaufpreis oder erste Leasingrate. */
export function acquisitionCents(model: VehicleModel, drive: VehicleDrive, lease: boolean): number {
  const price = modelValues(model, drive).priceCents;
  return lease ? leaseMonthlyCents(price) : price;
}

/** Fahrzeug verkaufen bzw. Leasing zurückgeben; es verschwindet sofort. false = unbekannt. */
export function disposeTruck(state: GameState, bus: EventBus, truckId: number): boolean {
  const t = state.vehicles.find((v) => v.id === truckId);
  if (t?.kind !== 'truck') return false;
  const amount = disposalCents(state, t);
  if (amount !== 0) {
    book(state.finance, state.tick, bus, 'vehicles', amount, {
      x: ENTRANCE.x + 1,
      z: ENTRANCE.z + 0.5,
    });
  }
  state.vehicles = state.vehicles.filter((v) => v.id !== truckId);
  bus.emit({ type: 'vehicle/disposed', id: truckId, amountCents: amount });
  return true;
}

/** Leasingraten am Fälligkeitstag; am Laufzeitende verlängert sich der Vertrag (Meldung). */
export function updateLeases(state: GameState, bus: EventBus): void {
  for (const t of state.vehicles) {
    if (t.kind !== 'truck' || !t.lease) continue;
    const lease = t.lease;
    if (state.tick >= lease.endTick) {
      lease.endTick = addMonths(lease.endTick, leaseConfig.termMonths);
      const at = t.route[0] ?? ENTRANCE;
      addNotice(state, bus, { kind: 'leaseRenewed', x: at.x, z: at.z, vehicleId: t.id });
    }
    if (state.tick >= lease.nextPaymentTick) {
      book(state.finance, state.tick, bus, 'vehicles', -lease.monthlyCents);
      lease.nextPaymentTick = addOneMonth(lease.nextPaymentTick);
    }
  }
}

/** Neuer Leasingvertrag ab jetzt; die erste Rate ist sofort fällig (beim Anschaffen gebucht). */
export function newLease(state: GameState, priceCents: number): Truck['lease'] {
  return {
    monthlyCents: leaseMonthlyCents(priceCents),
    nextPaymentTick: addOneMonth(state.tick),
    endTick: addMonths(state.tick, leaseConfig.termMonths),
  };
}
