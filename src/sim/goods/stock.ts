import type { ProductId } from '../../content/products';
import { zoneTypes } from '../../content/zones';
import { zoneCapacity } from '../commands/zones';
import type { GameState, Zone } from '../state/gameState';

export function stockOf(zone: Zone, product: ProductId): number {
  return zone.stock[product] ?? 0;
}

export function stores(zone: Zone, product: ProductId): boolean {
  return zoneTypes[zone.kind].stores.includes(product);
}

/** Ware, die gerade zu dieser Zone unterwegs ist (reservierter Platz). */
export function incoming(state: GameState, zoneId: number, product: ProductId): number {
  let sum = 0;
  for (const v of state.vehicles) {
    if (v.targetId === zoneId && v.cargo?.product === product && v.phase !== 'toExit') {
      sum += v.cargo.quantity;
    }
  }
  return sum;
}

/** Freier Platz für eine Ware, abzüglich bereits unterwegs befindlicher Lieferungen. */
export function freeSpace(state: GameState, zone: Zone, product: ProductId): number {
  if (!stores(zone, product)) return 0;
  return Math.max(
    0,
    zoneCapacity(zone) - stockOf(zone, product) - incoming(state, zone.id, product),
  );
}

export function addStock(zone: Zone, product: ProductId, quantity: number): void {
  zone.stock[product] = stockOf(zone, product) + quantity;
}

export function isFull(zone: Zone, product: ProductId): boolean {
  return stockOf(zone, product) >= zoneCapacity(zone);
}
