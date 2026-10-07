import { vehicleConfig } from '../../config/vehicles';
import type { EventBus } from '../core/eventBus';
import { addStock, available } from '../goods/stock';
import type { GameState } from '../state/gameState';
import type { RoadNetwork } from '../world/roadNetwork';
import { accessOf, drive, goIdle, setRoute, unloadAt } from './truckShared';
import type { TourStop, Truck } from './types';

/**
 * Feste Tour (T1.5b): Halte der Reihe nach anfahren, je Halt laden oder abladen, nach dem
 * letzten Halt wieder von vorn. ANNAHME: Der LKW wartet nicht auf volle Ladung, er nimmt
 * mit, was da ist, und fährt weiter.
 */
export function stepTourTruck(
  state: GameState,
  bus: EventBus,
  network: RoadNetwork,
  t: Truck,
): void {
  switch (t.phase) {
    case 'idle':
      if (--t.timer <= 0) startStop(state, network, t);
      return;
    case 'toPickup':
    case 'toDropoff': {
      const result = drive(t, network);
      if (result === 'blocked') headToStop(state, network, t);
      else if (result === 'arrived') {
        t.phase = t.phase === 'toPickup' ? 'loading' : 'unloading';
        t.timer = vehicleConfig.handlingTicks;
      }
      return;
    }
    case 'loading':
    case 'unloading':
      if (--t.timer > 0) return;
      handleStop(state, bus, t);
      t.tourIndex = (t.tourIndex + 1) % Math.max(1, t.tour.length);
      t.phase = 'idle';
      t.timer = 1;
      return;
  }
}

export function currentStop(t: Truck): TourStop | null {
  return t.tour[t.tourIndex % Math.max(1, t.tour.length)] ?? null;
}

function startStop(state: GameState, network: RoadNetwork, t: Truck): void {
  if (t.tour.length === 0) {
    goIdle(t, 'noTour');
    return;
  }
  headToStop(state, network, t);
}

function headToStop(state: GameState, network: RoadNetwork, t: Truck): void {
  const stop = currentStop(t);
  const target = stop ? accessOf(state, network, stop.siteId) : null;
  if (!stop || !target || !setRoute(t, network, target)) {
    goIdle(t, 'noRoute');
    return;
  }
  t.phase = stop.action === 'load' ? 'toPickup' : 'toDropoff';
  t.idleReason = null;
}

function handleStop(state: GameState, bus: EventBus, t: Truck): void {
  const stop = currentStop(t);
  if (!stop) return;
  if (stop.action === 'unload') {
    if (t.cargo?.product === stop.product) unloadAt(state, bus, t, stop.siteId);
    return;
  }
  const zone = state.zones.find((z) => z.id === stop.siteId);
  if (!zone || (t.cargo && t.cargo.product !== stop.product)) return;
  const loaded = t.cargo?.quantity ?? 0;
  const quantity = Math.min(
    vehicleConfig.truckCapacity - loaded,
    available(state, zone, stop.product),
  );
  if (quantity <= 0) return;
  addStock(zone, stop.product, -quantity);
  t.cargo = { product: stop.product, quantity: loaded + quantity };
}
