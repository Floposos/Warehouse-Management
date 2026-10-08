import { shapeArea } from '../world/zoneShape';
import { productionConfig } from '../../config/production';
import type { ProductId } from '../../content/products';
import type { ZoneKind } from '../../content/zones';
import type { EventBus } from '../core/eventBus';
import { addStock, isFull, stockOf } from '../goods/stock';
import type { GameState, Zone } from '../state/gameState';

interface Recipe {
  inputs: readonly ProductId[];
  output: ProductId;
  /** Arbeit je Einheit. */
  work: number;
  /** Arbeit je Schritt skaliert mit der Fläche (C) oder ist 1 (B). */
  scalesWithArea: boolean;
}

/** Rezepte je Lieferort: B kombiniert A + B zur Kombi, C verarbeitet sie zum Endprodukt. */
export const recipes: Partial<Record<ZoneKind, Recipe>> = {
  B: {
    inputs: ['rawA', 'rawB'],
    output: 'combo',
    work: productionConfig.comboTicksPerUnit,
    scalesWithArea: false,
  },
  C: {
    inputs: ['combo'],
    output: 'final',
    work: productionConfig.finalWorkPerUnit,
    scalesWithArea: true,
  },
};

/** Zustand einer Zone für Anzeige und Infofenster. */
export type ZoneStatus = 'working' | 'waitingInput' | 'full' | 'storing' | 'workshop';

export function zoneStatus(zone: Zone): ZoneStatus {
  if (zone.kind === 'W') return 'workshop';
  const recipe = recipes[zone.kind];
  if (!recipe) return isFull(zone, 'rawA') ? 'full' : 'storing';
  if (isFull(zone, recipe.output)) return 'full';
  return recipe.inputs.every((p) => stockOf(zone, p) >= 1) ? 'working' : 'waitingInput';
}

/** Je Schritt: arbeitende Zonen kommen voran; volle oder leere Zonen stehen. */
export function updateProduction(state: GameState, bus: EventBus): void {
  for (const zone of state.zones) {
    const recipe = recipes[zone.kind];
    if (!recipe || zoneStatus(zone) !== 'working') continue;
    zone.work += recipe.scalesWithArea ? shapeArea(zone.parts) : 1;
    if (zone.work < recipe.work) continue;
    for (const input of recipe.inputs) addStock(zone, input, -1);
    addStock(zone, recipe.output, 1);
    zone.work -= recipe.work;
    bus.emit({ type: 'goods/produced', zoneId: zone.id, product: recipe.output });
  }
}
