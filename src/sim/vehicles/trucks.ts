import { vehicleConfig } from '../../config/vehicles';
import type { EventBus } from '../core/eventBus';
import { book } from '../finance/ledger';
import { addStock, stockOf } from '../goods/stock';
import type { GameState } from '../state/gameState';
import { siteAccess } from '../world/sites';
import { dropsFor, findJob } from './truckJobs';
import { accessOf, drive, goIdle, setRoute, unloadAt } from './truckShared';
import { stepTourTruck } from './truckTour';
import type { Truck } from './types';
import type { VehicleCtx } from './vehicleCtx';

/** Ein Schritt eines eigenen LKW: feste Tour oder Automatik. */
export function stepTruck(ctx: VehicleCtx, t: Truck): void {
  if (t.tourId !== null) stepTourTruck(ctx, t);
  else stepAutoTruck(ctx, t);
}

/** Automatik: Auftrag suchen, hinfahren, laden, liefern, von vorn. */
function stepAutoTruck(ctx: VehicleCtx, t: Truck): void {
  switch (t.phase) {
    case 'idle':
      if (--t.timer > 0) return;
      t.timer = vehicleConfig.truckIdleCheckTicks;
      if (t.cargo) deliverCargoElsewhere(ctx, t);
      else startJob(ctx, t);
      return;
    case 'toPickup':
    case 'toDropoff': {
      const siteId = t.phase === 'toPickup' ? t.job?.fromId : t.job?.toId;
      const result = drive(ctx, t, siteId);
      if (result === 'blocked') reroute(ctx, t);
      else if (result === 'arrived') {
        t.phase = t.phase === 'toPickup' ? 'loading' : 'unloading';
        t.timer = vehicleConfig.handlingTicks;
      }
      return;
    }
    case 'loading':
      if (--t.timer > 0) return;
      ctx.traffic.leaveBay(t);
      load(ctx, t);
      return;
    case 'unloading':
      if (--t.timer > 0) return;
      ctx.traffic.leaveBay(t);
      unload(ctx, t);
      return;
  }
}

function idleAuto(ctx: VehicleCtx, t: Truck, reason: Parameters<typeof goIdle>[2]): void {
  goIdle(ctx, t, reason);
  if (!t.cargo) t.job = null;
}

function startJob(ctx: VehicleCtx, t: Truck): void {
  const position = t.route[0];
  if (!position) return;
  const network = ctx.traffic.network;
  const planned = findJob(ctx.state, network, position);
  if (planned === null || planned === 'noRoute') {
    idleAuto(ctx, t, planned ?? 'noJob');
    return;
  }
  t.job = planned.job;
  if (!setRoute(t, network, planned.target)) {
    idleAuto(ctx, t, 'noRoute');
    return;
  }
  t.phase = 'toPickup';
  t.idleReason = null;
}

function reroute(ctx: VehicleCtx, t: Truck): void {
  const id = t.phase === 'toPickup' ? t.job?.fromId : t.job?.toId;
  const network = ctx.traffic.network;
  const target = id === undefined ? null : accessOf(ctx.state, network, id);
  if (!target || !setRoute(t, network, target)) idleAuto(ctx, t, 'noRoute');
}

function load(ctx: VehicleCtx, t: Truck): void {
  const zone = ctx.state.zones.find((z) => z.id === t.job?.fromId);
  const quantity = zone && t.job ? Math.min(t.job.quantity, stockOf(zone, t.job.product)) : 0;
  if (!zone || !t.job || quantity <= 0) {
    idleAuto(ctx, t, null);
    return;
  }
  addStock(zone, t.job.product, -quantity);
  t.cargo = { product: t.job.product, quantity };
  t.job.quantity = quantity;
  t.phase = 'toDropoff';
  reroute(ctx, t);
}

function unload(ctx: VehicleCtx, t: Truck): void {
  if (t.job) unloadAt(ctx, t, t.job.toId);
  t.job = null;
  idleAuto(ctx, t, null);
  t.timer = 1;
  if (t.cargo) deliverCargoElsewhere(ctx, t);
}

/** Ladung ohne (gültiges) Ziel: neues Ziel für dieselbe Ware suchen. */
function deliverCargoElsewhere(ctx: VehicleCtx, t: Truck): void {
  const cargo = t.cargo;
  if (!cargo) return;
  const network = ctx.traffic.network;
  for (const drop of dropsFor(ctx.state, cargo.product)) {
    const access = siteAccess(network, drop.site);
    if (!access) continue;
    const fromId = t.job?.fromId ?? drop.site.id;
    t.job = { product: cargo.product, fromId, toId: drop.site.id, quantity: cargo.quantity };
    if (!setRoute(t, network, access)) continue;
    t.phase = 'toDropoff';
    t.idleReason = null;
    return;
  }
  t.job = null;
  goIdle(ctx, t, 'noDestination');
}

/** Tageswechsel: feste Tageskosten und Kilometerkosten je LKW (Kasse: „Fahrzeuge“). */
export function bookTruckCosts(state: GameState, bus: EventBus): void {
  // Tausendstel Feld × Meter je Feld × Cent je km = Millionstel Cent (1 km = 1000 m).
  const rate = vehicleConfig.metersPerField * vehicleConfig.truckCostPerKmCents;
  for (const t of state.vehicles) {
    if (t.kind !== 'truck') continue;
    const micro = t.odometer * rate;
    const kmCents = Math.floor(micro / 1_000_000);
    // Rest als ganze Tausendstel Feld übertragen (Spielstand speichert nur ganze Zahlen).
    t.odometer = Math.floor((micro - kmCents * 1_000_000) / rate);
    book(state.finance, state.tick, bus, 'vehicles', -(vehicleConfig.truckDailyCents + kmCents));
  }
}
