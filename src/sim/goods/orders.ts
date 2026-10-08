import { goodsConfig } from '../../config/goods';
import { vehicleConfig } from '../../config/vehicles';
import { rawProducts, type RawProductId } from '../../content/products';
import type { EventBus } from '../core/eventBus';
import { TICKS_PER_DAY, addOneMonth } from '../core/gameTime';
import { book } from '../finance/ledger';
import type { GameState, Order, Zone } from '../state/gameState';
import { accessCell } from '../world/access';
import { findPath } from '../world/pathfinding';
import type { Cell } from '../world/roadLine';
import { ENTRANCE, RoadNetwork } from '../world/roadNetwork';
import { outsideLane } from '../vehicles/movement';
import { vehicleBase } from '../vehicles/types';
import { freeSpace } from './stock';

export const ORDER_INTERVALS = ['once', 'daily', 'weekly', 'monthly'] as const;
export type OrderInterval = (typeof ORDER_INTERVALS)[number];
/** Warum eine fällige Lieferung wartet. Texte in ui/texts/de.ts. */
export type OrderBlock = 'noSite' | 'noRoute' | 'full' | 'noMoney';

export function createOrder(
  state: GameState,
  product: RawProductId,
  quantity: number,
  interval: OrderInterval,
): Order | null {
  if (!(product in rawProducts) || !ORDER_INTERVALS.includes(interval)) return null;
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return null;
  const order: Order = {
    id: state.nextId++,
    product,
    quantity,
    interval,
    nextTick: state.tick,
    blocked: null,
  };
  state.orders.push(order);
  return order;
}

export function cancelOrder(state: GameState, id: number): boolean {
  const index = state.orders.findIndex((o) => o.id === id);
  if (index < 0) return false;
  state.orders.splice(index, 1);
  return true;
}

export function nextDelivery(tick: number, interval: OrderInterval): number | null {
  switch (interval) {
    case 'once':
      return null;
    case 'daily':
      return tick + TICKS_PER_DAY;
    case 'weekly':
      return tick + 7 * TICKS_PER_DAY;
    case 'monthly':
      return addOneMonth(tick);
  }
}

interface Target {
  zone: Zone;
  path: Cell[];
  free: number;
}

/** Bester Lieferort: erreichbar, mit dem meisten freien Platz (bei Gleichstand kleinste ID). */
function findTarget(state: GameState, network: RoadNetwork, order: Order): Target | OrderBlock {
  const kind = rawProducts[order.product];
  const zones = state.zones.filter((z) => z.kind === kind);
  if (zones.length === 0) return 'noSite';
  let best: Target | null = null;
  let anyReachable = false;
  for (const zone of zones) {
    const access = accessCell(network, zone.parts, zone.gate);
    const path = access ? findPath(network, ENTRANCE, access) : null;
    if (!path) continue;
    anyReachable = true;
    const free = freeSpace(state, zone, order.product);
    if (free > 0 && (!best || free > best.free)) best = { zone, path, free };
  }
  if (best) return best;
  return anyReachable ? 'full' : 'noRoute';
}

/** Versucht eine fällige Lieferung: Ware bezahlen, Zulieferer-LKW losschicken. */
export function dispatchOrder(state: GameState, bus: EventBus, order: Order): OrderBlock | null {
  const network = new RoadNetwork(state);
  const target = findTarget(state, network, order);
  if (typeof target === 'string') return target;
  const quantity = Math.min(order.quantity, target.free);
  const costCents = quantity * goodsConfig.purchasePriceCents[order.product];
  if (state.finance.balanceCents < costCents) return 'noMoney';
  book(state.finance, state.tick, bus, 'rawGoods', -costCents, { x: 0.5, z: ENTRANCE.z + 0.5 });
  state.vehicles.push({
    // Kommt von außen und fädelt auf der Eingangsstraße ein, sobald dort Platz ist.
    ...vehicleBase(state.nextId++, [...outsideLane(), ...target.path], true),
    kind: 'supplier',
    cargo: { product: order.product, quantity },
    phase: 'toSite',
    targetId: target.zone.id,
    timer: 0,
    paidCents: costCents,
  });
  return null;
}

/** Prüft je Schritt die fälligen Bestellungen in fester Reihenfolge. */
export function updateOrders(state: GameState, bus: EventBus): void {
  for (const order of [...state.orders]) {
    if (order.nextTick > state.tick) continue;
    const block = dispatchOrder(state, bus, order);
    order.blocked = block;
    if (block) {
      order.nextTick = state.tick + vehicleConfig.retryTicks;
      continue;
    }
    const next = nextDelivery(state.tick, order.interval);
    if (next === null) cancelOrder(state, order.id);
    else order.nextTick = next;
  }
}
