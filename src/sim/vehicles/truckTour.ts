import { vehicleConfig } from '../../config/vehicles';
import { addStock, available } from '../goods/stock';
import type { GameState } from '../state/gameState';
import { valuesOf } from './fleet';
import { tourOf } from './tours';
import { accessOf, drive, goIdle, setRoute, unloadAt } from './truckShared';
import type { TourStop, Truck } from './types';
import type { VehicleCtx } from './vehicleCtx';

/**
 * Feste Tour (T1.5b): Halte der Reihe nach anfahren, je Halt laden oder abladen, nach dem
 * letzten Halt wieder von vorn. Entscheidung 08.10.2026: Der LKW wartet nicht auf volle
 * Ladung, er nimmt mit, was da ist, und fährt weiter.
 */
export function stepTourTruck(ctx: VehicleCtx, t: Truck): void {
  switch (t.phase) {
    case 'idle':
      if (--t.timer <= 0) startStop(ctx, t);
      return;
    case 'toPickup':
    case 'toDropoff': {
      const result = drive(ctx, t, currentStop(ctx.state, t)?.siteId);
      if (result === 'blocked') headToStop(ctx, t);
      else if (result === 'arrived') {
        t.phase = t.phase === 'toPickup' ? 'loading' : 'unloading';
        t.timer = vehicleConfig.handlingTicks;
      }
      return;
    }
    case 'loading':
    case 'unloading':
      if (--t.timer > 0) return;
      handleStop(ctx, t);
      ctx.traffic.leaveBay(t);
      t.tourIndex = (t.tourIndex + 1) % Math.max(1, tourOf(ctx.state, t)?.stops.length ?? 1);
      t.phase = 'idle';
      t.timer = 1;
      return;
    default:
      return;
  }
}

export function currentStop(state: GameState, t: Truck): TourStop | null {
  const stops = tourOf(state, t)?.stops ?? [];
  return stops[t.tourIndex % Math.max(1, stops.length)] ?? null;
}

function startStop(ctx: VehicleCtx, t: Truck): void {
  if (!currentStop(ctx.state, t)) {
    goIdle(ctx, t, 'noTour');
    return;
  }
  headToStop(ctx, t);
}

function headToStop(ctx: VehicleCtx, t: Truck): void {
  const network = ctx.traffic.network;
  const stop = currentStop(ctx.state, t);
  const target = stop ? accessOf(ctx.state, network, stop.siteId) : null;
  if (!stop || !target || !setRoute(t, network, target)) {
    goIdle(ctx, t, 'noRoute');
    return;
  }
  t.phase = stop.action === 'load' ? 'toPickup' : 'toDropoff';
  t.idleReason = null;
}

function handleStop(ctx: VehicleCtx, t: Truck): void {
  const stop = currentStop(ctx.state, t);
  if (!stop) return;
  if (stop.action === 'unload') {
    if (t.cargo?.product === stop.product) unloadAt(ctx, t, stop.siteId);
    return;
  }
  const zone = ctx.state.zones.find((z) => z.id === stop.siteId);
  if (!zone || (t.cargo && t.cargo.product !== stop.product)) return;
  const loaded = t.cargo?.quantity ?? 0;
  const quantity = Math.min(
    valuesOf(t).capacity - loaded,
    available(ctx.state, zone, stop.product),
  );
  if (quantity <= 0) return;
  addStock(zone, stop.product, -quantity);
  t.cargo = { product: stop.product, quantity: loaded + quantity };
}
