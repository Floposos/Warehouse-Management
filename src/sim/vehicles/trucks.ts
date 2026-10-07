import { vehicleConfig } from '../../config/vehicles';
import type { EventBus } from '../core/eventBus';
import { isDayStart } from '../core/gameTime';
import { book } from '../finance/ledger';
import { addStock, stockOf } from '../goods/stock';
import type { GameState } from '../state/gameState';
import { RoadNetwork } from '../world/roadNetwork';
import { siteAccess } from '../world/sites';
import { dropsFor, findJob } from './truckJobs';
import { accessOf, drive, goIdle, setRoute, unloadAt } from './truckShared';
import { stepTourTruck } from './truckTour';
import type { Truck } from './types';

/** Eigene LKW: Automatik oder feste Tour; am Tageswechsel die Fahrzeugkosten. */
export function updateTrucks(state: GameState, bus: EventBus): void {
  const network = new RoadNetwork(state);
  for (const v of state.vehicles) {
    if (v.kind !== 'truck') continue;
    if (v.mode === 'tour') stepTourTruck(state, bus, network, v);
    else stepAutoTruck(state, bus, network, v);
  }
  if (isDayStart(state.tick)) bookTruckCosts(state, bus);
}

/** Automatik: Auftrag suchen, hinfahren, laden, liefern, von vorn. */
function stepAutoTruck(state: GameState, bus: EventBus, network: RoadNetwork, t: Truck): void {
  switch (t.phase) {
    case 'idle':
      if (--t.timer > 0) return;
      t.timer = vehicleConfig.truckIdleCheckTicks;
      if (t.cargo) deliverCargoElsewhere(state, network, t);
      else startJob(state, network, t);
      return;
    case 'toPickup':
    case 'toDropoff': {
      const result = drive(t, network);
      if (result === 'blocked') reroute(state, network, t);
      else if (result === 'arrived') {
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

function idleAuto(t: Truck, reason: Parameters<typeof goIdle>[1]): void {
  goIdle(t, reason);
  if (!t.cargo) t.job = null;
}

function startJob(state: GameState, network: RoadNetwork, t: Truck): void {
  const position = t.route[0];
  if (!position) return;
  const planned = findJob(state, network, position);
  if (planned === null || planned === 'noRoute') {
    idleAuto(t, planned ?? 'noJob');
    return;
  }
  t.job = planned.job;
  if (!setRoute(t, network, planned.target)) {
    idleAuto(t, 'noRoute');
    return;
  }
  t.phase = 'toPickup';
  t.idleReason = null;
}

function reroute(state: GameState, network: RoadNetwork, t: Truck): void {
  const id = t.phase === 'toPickup' ? t.job?.fromId : t.job?.toId;
  const target = id === undefined ? null : accessOf(state, network, id);
  if (!target || !setRoute(t, network, target)) idleAuto(t, 'noRoute');
}

function load(state: GameState, network: RoadNetwork, t: Truck): void {
  const zone = state.zones.find((z) => z.id === t.job?.fromId);
  const quantity = zone && t.job ? Math.min(t.job.quantity, stockOf(zone, t.job.product)) : 0;
  if (!zone || !t.job || quantity <= 0) {
    idleAuto(t, null);
    return;
  }
  addStock(zone, t.job.product, -quantity);
  t.cargo = { product: t.job.product, quantity };
  t.job.quantity = quantity;
  t.phase = 'toDropoff';
  reroute(state, network, t);
}

function unload(state: GameState, bus: EventBus, network: RoadNetwork, t: Truck): void {
  if (t.job) unloadAt(state, bus, t, t.job.toId);
  t.job = null;
  idleAuto(t, null);
  t.timer = 1;
  if (t.cargo) deliverCargoElsewhere(state, network, t);
}

/** Ladung ohne (gültiges) Ziel: neues Ziel für dieselbe Ware suchen. */
function deliverCargoElsewhere(state: GameState, network: RoadNetwork, t: Truck): void {
  const cargo = t.cargo;
  if (!cargo) return;
  for (const drop of dropsFor(state, cargo.product)) {
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
