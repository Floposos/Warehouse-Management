import { maintenanceConfig as mc } from '../../config/maintenance';
import { nextFloat } from '../core/rng';
import { addNotice } from '../events/notices';
import { book } from '../finance/ledger';
import { ENTRANCE } from '../world/roadNetwork';
import type { Truck, Upkeep } from './types';
import type { VehicleCtx } from './vehicleCtx';

export function newUpkeep(): Upkeep {
  return {
    condition: mc.fullCondition,
    wearRest: 0,
    brokenTicks: 0,
    breakdowns: 0,
    lastBreakdownTick: null,
    lastServiceTick: null,
    serviceRequested: false,
    warnedNoWorkshop: false,
    workshopId: null,
  };
}

/** Pannenrisiko je gefahrenem Feld (0 … 1), quadratisch steigend mit dem Verschleiß. */
export function breakdownChancePerField(condition: number): number {
  const worn = 1 - Math.max(0, Math.min(mc.fullCondition, condition)) / mc.fullCondition;
  return (mc.breakdownPerKmAtZeroPpm / 1_000_000) * worn * worn * 0.01;
}

/** Braucht Wartung: unter der Schwelle oder vom Spieler geschickt. */
export function needsService(t: Truck): boolean {
  return t.upkeep.serviceRequested || t.upkeep.condition < mc.serviceBelow;
}

/** Gefahrene Kilometer bis zur nächsten automatischen Wartung (0 = fällig). */
export function kmUntilService(t: Truck): number {
  const rest = t.upkeep.condition - mc.serviceBelow;
  return rest <= 0 ? 0 : Math.ceil(rest / (mc.wearPerField * 100));
}

/**
 * Verschleiß für gefahrene Strecke (Tausendstel Feld) und je ganzem Feld auf der Straße ein
 * Würfelwurf aus dem eigenen Zufallsstrom der Ereignisse (deterministisch, T2.6).
 */
export function applyWear(ctx: VehicleCtx, t: Truck, moved: number): void {
  if (moved <= 0) return;
  const u = t.upkeep;
  u.wearRest += moved;
  while (u.wearRest >= 1000) {
    u.wearRest -= 1000;
    u.condition = Math.max(0, u.condition - mc.wearPerField);
    if (u.brokenTicks === 0 && !t.offRoad) {
      if (nextFloat(ctx.state.eventRng) < breakdownChancePerField(u.condition)) breakDown(ctx, t);
    }
  }
}

/** Panne: steht und blockiert die Spur, Abschleppkosten sofort, Meldung. */
export function breakDown(ctx: VehicleCtx, t: Truck): void {
  const { state, bus } = ctx;
  const u = t.upkeep;
  u.brokenTicks = mc.breakdownTicks;
  u.breakdowns += 1;
  u.lastBreakdownTick = state.tick;
  const here = t.route[0] ?? ENTRANCE;
  book(state.finance, state.tick, bus, 'vehicles', -mc.towCostCents, {
    x: here.x + 0.5,
    z: here.z + 0.5,
  });
  bus.emit({ type: 'vehicle/brokeDown', id: t.id, x: here.x, z: here.z });
  addNotice(state, bus, { kind: 'breakdown', x: here.x, z: here.z, vehicleId: t.id });
}

/** Ein Schritt Panne; true = steht noch (sonst normal weiter). */
export function stepBreakdown(t: Truck): boolean {
  const u = t.upkeep;
  if (u.brokenTicks <= 0) return false;
  u.brokenTicks -= 1;
  if (u.brokenTicks === 0)
    u.condition = Math.min(mc.fullCondition, u.condition + mc.breakdownRepair);
  return true;
}

/** Wartung abgeschlossen: Kosten buchen, Zustand voll. */
export function finishService(ctx: VehicleCtx, t: Truck): void {
  const u = t.upkeep;
  const here = t.route[0] ?? ENTRANCE;
  book(ctx.state.finance, ctx.state.tick, ctx.bus, 'vehicles', -mc.serviceCostCents, {
    x: here.x + 0.5,
    z: here.z + 0.5,
  });
  u.condition = mc.fullCondition;
  u.serviceRequested = false;
  u.warnedNoWorkshop = false;
  u.lastServiceTick = ctx.state.tick;
  u.workshopId = null;
}

/** Meldung „keine Werkstatt“ einmal je fälliger Wartung. */
export function warnNoWorkshop(ctx: VehicleCtx, t: Truck): void {
  const u = t.upkeep;
  if (u.warnedNoWorkshop) return;
  u.warnedNoWorkshop = true;
  const here = t.route[0] ?? ENTRANCE;
  addNotice(ctx.state, ctx.bus, { kind: 'noWorkshop', x: here.x, z: here.z, vehicleId: t.id });
}
