import { buildConfig } from '../../config/build';
import { buildingTypes, type BuildingTypeId } from '../../content/buildings';
import type { EventBus } from '../core/eventBus';
import { TICKS_PER_DAY } from '../core/gameTime';
import { book } from '../finance/ledger';
import type { GameState } from '../state/gameState';
import { GRID_DEPTH, GRID_WIDTH, isInsideCampus, type Footprint } from '../world/grid';
import { buildOccupancy, buildingFootprint, isFree } from '../world/occupancy';

/** Gründe, warum etwas nicht gebaut werden kann (Texte in ui/texts/de.ts). */
export type BuildRejection =
  'outOfBounds' | 'occupied' | 'insufficientFunds' | 'unknownType' | 'tooSmall' | 'notAtEdge';

export type BuildCheck =
  { ok: true; costCents: number } | { ok: false; reason: BuildRejection; costCents: number };

export function buildingCost(type: BuildingTypeId): number {
  return buildConfig.buildingCostCents[type];
}

/** Prüft, ob ein Gebäude an (x, z) gebaut werden kann. Für Vorschau und Befehl identisch. */
export function checkPlaceBuilding(
  state: GameState,
  type: BuildingTypeId,
  x: number,
  z: number,
): BuildCheck {
  if (!(type in buildingTypes)) return { ok: false, reason: 'unknownType', costCents: 0 };
  const costCents = buildingCost(type);
  const footprint = buildingFootprint({ type, x, z });
  if (!isInsideCampus(footprint)) return { ok: false, reason: 'outOfBounds', costCents };
  if ('atEdge' in buildingTypes[type] && !touchesEdge(footprint)) {
    return { ok: false, reason: 'notAtEdge', costCents };
  }
  if (!isFree(buildOccupancy(state), footprint))
    return { ok: false, reason: 'occupied', costCents };
  if (state.finance.balanceCents < costCents) {
    return { ok: false, reason: 'insufficientFunds', costCents };
  }
  return { ok: true, costCents };
}

/** Berührt die Fläche den Geländerand? */
export function touchesEdge(f: Footprint): boolean {
  return f.x === 0 || f.z === 0 || f.x + f.width === GRID_WIDTH || f.z + f.depth === GRID_DEPTH;
}

/** Erstattung beim Abriss: 100 % am selben Spieltag, danach 50 % (gerundet auf Cent). */
export function demolishRefund(state: GameState, builtTick: number, paidCents: number): number {
  const sameDay = Math.floor(builtTick / TICKS_PER_DAY) === Math.floor(state.tick / TICKS_PER_DAY);
  const share = sameDay ? buildConfig.refundSameDay : buildConfig.refundLater;
  return Math.round(paidCents * share);
}

export function placeBuilding(
  state: GameState,
  bus: EventBus,
  type: BuildingTypeId,
  x: number,
  z: number,
): BuildCheck {
  const check = checkPlaceBuilding(state, type, x, z);
  if (!check.ok) return check;
  const id = state.nextId++;
  state.buildings.push({ id, type, x, z, builtTick: state.tick, paidCents: check.costCents });
  const size = buildingTypes[type];
  bookBuild(state, bus, -check.costCents, { x: x + size.width / 2, z: z + size.depth / 2 });
  bus.emit({ type: 'build/placed', id, buildingType: type, x, z, costCents: check.costCents });
  return check;
}

export function demolishBuilding(state: GameState, bus: EventBus, id: number): number | null {
  const index = state.buildings.findIndex((b) => b.id === id);
  const building = state.buildings[index];
  if (!building) return null;
  const refund = demolishRefund(state, building.builtTick, building.paidCents);
  state.buildings.splice(index, 1);
  const f = buildingFootprint(building);
  bookBuild(state, bus, refund, { x: f.x + f.width / 2, z: f.z + f.depth / 2 });
  bus.emit({ type: 'build/demolished', id, refundCents: refund });
  return refund;
}

/** Bucht Bau-Kosten bzw. Erstattungen (Kategorie „Bau“) mit Ort für die schwebende Anzeige. */
export function bookBuild(
  state: GameState,
  bus: EventBus,
  amountCents: number,
  at: { x: number; z: number },
): void {
  book(state.finance, state.tick, bus, 'build', amountCents, at);
}
