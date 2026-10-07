import { vehicleConfig } from '../../config/vehicles';
import type { EventBus } from '../core/eventBus';
import { isDayStart } from '../core/gameTime';
import { book } from '../finance/ledger';
import { sellAtExit } from '../goods/export';
import { addStock, stockOf } from '../goods/stock';
import { zoneCapacity } from '../commands/zones';
import type { GameState } from '../state/gameState';
import { RoadNetwork } from '../world/roadNetwork';
import { siteAccess, sites } from '../world/sites';
import { advance, planRoute } from './movement';
import { dropsFor, findJob } from './truckJobs';
import type { Truck, TruckIdleReason } from './types';

/** Eigene LKW in der Automatik: Auftrag suchen, hinfahren, laden, liefern, von vorn. */
export function updateTrucks(state: GameState, bus: EventBus): void {
  const network = new RoadNetwork(state);
  for (const v of state.vehicles) if (v.kind === 'truck') stepTruck(state, bus, network, v);
  if (isDayStart(state.tick)) bookTruckCosts(state, bus);
}

function stepTruck(state: GameState, bus: EventBus, network: RoadNetwork, t: Truck): void {
  switch (t.phase) {
    case 'idle':
      if (--t.timer > 0) return;
      t.timer = vehicleConfig.truckIdleCheckTicks;
      if (t.cargo) deliverCargoElsewhere(state, network, t);
      else startJob(state, network, t);
      return;
    case 'toPickup':
    case 'toDropoff': {
      const { arrived, blocked, moved } = advance(t, vehicleConfig.truckSpeed, network);
      t.odometer += moved;
      if (blocked) reroute(state, network, t);
      else if (arrived) {
        t.phase = t.phase === 'toPickup' ? 'loading' : 'unloading';
        t.timer = vehicleConfig.handlingTicks;
      }
      return;
    }
    case 'loading':
      if (--t.timer <= 0) load(state, network, t);
      return;
    case 'unloading':
      if (--t.timer <= 0) unload(state, bus, network, t);
      return;
  }
}

function goIdle(t: Truck, reason: TruckIdleReason | null): void {
  t.phase = 'idle';
  t.idleReason = reason;
  t.timer = vehicleConfig.truckIdleCheckTicks;
  if (!t.cargo) t.job = null;
}

function startJob(state: GameState, network: RoadNetwork, t: Truck): void {
  const position = t.route[0];
  if (!position) return;
  const planned = findJob(state, network, position);
  if (planned === null || planned === 'noRoute') {
    goIdle(t, planned ?? 'noJob');
    return;
  }
  t.job = planned.job;
  t.route = planned.route;
  t.progress = 0;
  t.phase = 'toPickup';
  t.idleReason = null;
}

/** Ziel des aktuellen Abschnitts (Abholort oder Lieferort). */
function legTarget(state: GameState, network: RoadNetwork, t: Truck) {
  if (!t.job) return null;
  const id = t.phase === 'toPickup' ? t.job.fromId : t.job.toId;
  const site = sites(state).find((s) => s.id === id);
  return site ? siteAccess(network, site) : null;
}

function reroute(state: GameState, network: RoadNetwork, t: Truck): void {
  const target = legTarget(state, network, t);
  const position = t.route[0];
  const route = target && position ? planRoute(network, position, target) : null;
  if (!route) {
    goIdle(t, 'noRoute');
    return;
  }
  t.route = route;
  t.progress = 0;
}

function load(state: GameState, network: RoadNetwork, t: Truck): void {
  const zone = state.zones.find((z) => z.id === t.job?.fromId);
  const quantity = zone && t.job ? Math.min(t.job.quantity, stockOf(zone, t.job.product)) : 0;
  if (!zone || !t.job || quantity <= 0) {
    goIdle(t, null);
    return;
  }
  addStock(zone, t.job.product, -quantity);
  t.cargo = { product: t.job.product, quantity };
  t.job.quantity = quantity;
  t.phase = 'toDropoff';
  reroute(state, network, t);
}

function unload(state: GameState, bus: EventBus, network: RoadNetwork, t: Truck): void {
  const cargo = t.cargo;
  const job = t.job;
  if (!cargo || !job) {
    goIdle(t, null);
    return;
  }
  const zone = state.zones.find((z) => z.id === job.toId);
  if (zone) {
    const quantity = Math.min(cargo.quantity, zoneCapacity(zone) - stockOf(zone, cargo.product));
    addStock(zone, cargo.product, quantity);
    bus.emit({ type: 'goods/delivered', zoneId: zone.id, product: cargo.product, quantity });
    cargo.quantity -= quantity;
  } else if (sellAtExit(state, bus, job.toId, cargo.product, cargo.quantity) !== null) {
    cargo.quantity = 0;
  }
  if (cargo.quantity <= 0) t.cargo = null;
  t.job = null;
  goIdle(t, null);
  t.timer = 1;
  if (t.cargo) deliverCargoElsewhere(state, network, t);
}

/** Ladung ohne (gültiges) Ziel: neues Ziel für dieselbe Ware suchen. */
function deliverCargoElsewhere(state: GameState, network: RoadNetwork, t: Truck): void {
  const cargo = t.cargo;
  const position = t.route[0];
  if (!cargo || !position) return;
  for (const drop of dropsFor(state, cargo.product)) {
    const access = siteAccess(network, drop.site);
    const route = access ? planRoute(network, position, access) : null;
    if (!route) continue;
    const fromId = t.job?.fromId ?? drop.site.id;
    t.job = { product: cargo.product, fromId, toId: drop.site.id, quantity: cargo.quantity };
    t.route = route;
    t.progress = 0;
    t.phase = 'toDropoff';
    t.idleReason = null;
    return;
  }
  goIdle(t, 'noDestination');
}

/** Tageswechsel: feste Tageskosten und Kilometerkosten je LKW (Kasse: „Fahrzeuge“). */
function bookTruckCosts(state: GameState, bus: EventBus): void {
  const milliPerCent =
    1_000_000 / (vehicleConfig.metersPerField * vehicleConfig.truckCostPerKmCents);
  for (const t of state.vehicles) {
    if (t.kind !== 'truck') continue;
    const kmCents = Math.floor(t.odometer / milliPerCent);
    t.odometer -= kmCents * milliPerCent;
    book(state.finance, state.tick, bus, 'vehicles', -(vehicleConfig.truckDailyCents + kmCents));
  }
}
