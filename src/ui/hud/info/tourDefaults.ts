import type { ProductId } from '../../../content/products';
import { productIds } from '../../../content/products';
import type { GameState } from '../../../sim/state/gameState';
import { isValidStop } from '../../../sim/vehicles/truckCommands';
import type { TourStop } from '../../../sim/vehicles/types';
import { sites } from '../../../sim/world/sites';

/** Was ein Ort ausgibt (Vorschlag „Laden“). */
const OUTPUT: Record<'A' | 'B' | 'C', ProductId> = { A: 'rawA', B: 'combo', C: 'final' };

/** Waren, die an diesem Ort mit dieser Aktion gehen. */
export function productsFor(state: GameState, siteId: number, action: TourStop['action']) {
  return productIds.filter((product) => isValidStop(state, { siteId, action, product }));
}

/**
 * Vorschlag für einen neuen Halt: Wurde vorher etwas geladen, das hier abgeladen werden
 * kann, dann „Abladen“ dieser Ware; sonst „Laden“ dessen, was der Ort herstellt bzw.
 * lagert (Export-Ausfahrt: Endprodukt abladen). null = Ort unbekannt.
 */
export function defaultStop(
  state: GameState,
  siteId: number,
  previous: TourStop | undefined,
): TourStop | null {
  const site = sites(state).find((s) => s.id === siteId);
  if (!site) return null;
  if (
    previous?.action === 'load' &&
    previous.siteId !== siteId &&
    isValidStop(state, { siteId, action: 'unload', product: previous.product })
  ) {
    return { siteId, action: 'unload', product: previous.product };
  }
  if (site.kind === 'export') return { siteId, action: 'unload', product: 'final' };
  return { siteId, action: 'load', product: OUTPUT[site.kind] };
}
