import { goodsConfig } from '../../config/goods';
import type { ProductId } from '../../content/products';
import type { EventBus } from '../core/eventBus';
import { book } from '../finance/ledger';
import type { GameState } from '../state/gameState';
import { buildingFootprint } from '../world/occupancy';

/** Waren mit festem Exportpreis. */
export function exportPrice(product: ProductId): number | null {
  const prices: Partial<Record<ProductId, number>> = goodsConfig.exportPriceCents;
  return prices[product] ?? null;
}

/**
 * Verkauft Ware an einer Export-Ausfahrt zum festen Preis je Ware (Entscheidung 07.10.2026).
 * Liefert den Erlös in Cent oder null, wenn die Ware nicht exportiert werden kann.
 */
export function sellAtExit(
  state: GameState,
  bus: EventBus,
  exitId: number,
  product: ProductId,
  quantity: number,
): number | null {
  const exit = state.buildings.find((b) => b.id === exitId && b.type === 'exportExit');
  const price = exportPrice(product);
  if (!exit || price === null || quantity <= 0) return null;
  const f = buildingFootprint(exit);
  const revenue = price * quantity;
  book(state.finance, state.tick, bus, 'exportRevenue', revenue, {
    x: f.x + f.width / 2,
    z: f.z + f.depth / 2,
  });
  bus.emit({ type: 'goods/sold', exitId, product, quantity, revenueCents: revenue });
  return revenue;
}
