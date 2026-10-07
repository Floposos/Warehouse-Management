import { vehicleConfig } from '../../config/vehicles';
import type { EventBus } from '../core/eventBus';
import { book } from '../finance/ledger';
import { addStock } from '../goods/stock';
import { zoneCapacity } from '../commands/zones';
import type { GameState } from '../state/gameState';
import type { Supplier, Vehicle } from './types';
import { accessCell } from '../world/access';
import { ENTRANCE, RoadNetwork } from '../world/roadNetwork';
import { advance, outsideLane, planRoute } from './movement';

/**
 * Zulieferer-LKW: fahren von der Einfahrt zum Lieferort, laden ab und fahren wieder hinaus.
 * Fällt der Lieferort weg, kehren sie um und die Ware wird erstattet. Ist der Weg
 * unterbrochen, warten sie und versuchen es regelmäßig erneut.
 */
export function updateSuppliers(state: GameState, bus: EventBus): void {
  const network = new RoadNetwork(state);
  const remaining: Vehicle[] = [];
  for (const v of state.vehicles) {
    if (v.kind !== 'supplier' || stepSupplier(state, bus, network, v)) remaining.push(v);
  }
  state.vehicles = remaining;
}

/** Ein Schritt für einen Zulieferer. Liefert false, wenn er das Gelände verlassen hat. */
function stepSupplier(state: GameState, bus: EventBus, network: RoadNetwork, v: Supplier): boolean {
  const zone = state.zones.find((z) => z.id === v.targetId);
  if (v.cargo && !zone) turnBack(state, bus, network, v);
  switch (v.phase) {
    case 'toSite':
    case 'toExit': {
      const { arrived, blocked } = advance(v, vehicleConfig.supplierSpeed, network);
      if (blocked) replan(network, state, v);
      else if (arrived && v.phase === 'toExit') return false;
      else if (arrived) {
        v.phase = 'handling';
        v.timer = vehicleConfig.handlingTicks;
      }
      return true;
    }
    case 'handling':
      if (--v.timer > 0) return true;
      if (zone && v.cargo) {
        const quantity = Math.min(
          v.cargo.quantity,
          zoneCapacity(zone) - (zone.stock[v.cargo.product] ?? 0),
        );
        addStock(zone, v.cargo.product, quantity);
        bus.emit({ type: 'goods/delivered', zoneId: zone.id, product: v.cargo.product, quantity });
      }
      v.cargo = null;
      leave(network, v);
      return true;
    case 'noRoute':
      if (--v.timer <= 0) replan(network, state, v);
      return true;
  }
}

/** Ziel weg: bezahlte Ware erstatten und hinausfahren. */
function turnBack(state: GameState, bus: EventBus, network: RoadNetwork, v: Supplier): void {
  book(state.finance, state.tick, bus, 'rawGoods', v.paidCents, null);
  v.paidCents = 0;
  v.cargo = null;
  leave(network, v);
}

function leave(network: RoadNetwork, v: Supplier): void {
  const from = v.route[0] ?? ENTRANCE;
  const route = planRoute(network, from, ENTRANCE);
  if (!route) {
    v.phase = 'noRoute';
    v.timer = vehicleConfig.retryTicks;
    return;
  }
  v.route = [...route, ...outsideLane().reverse()];
  v.progress = 0;
  v.phase = 'toExit';
}

function replan(network: RoadNetwork, state: GameState, v: Supplier): void {
  if (!v.cargo) {
    leave(network, v);
    return;
  }
  const zone = state.zones.find((z) => z.id === v.targetId);
  const access = zone ? accessCell(network, zone, zone.gate) : null;
  const route = access ? planRoute(network, v.route[0] ?? ENTRANCE, access) : null;
  if (!route) {
    v.phase = 'noRoute';
    v.timer = vehicleConfig.retryTicks;
    return;
  }
  v.route = route;
  v.progress = 0;
  v.phase = 'toSite';
}
