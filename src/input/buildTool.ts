import { buildingTypes, type BuildingTypeId } from '../content/buildings';
import { checkPlaceBuilding, demolishRefund, type BuildRejection } from '../sim/commands/build';
import type { Command } from '../sim/commands/commands';
import type { GameState } from '../sim/state/gameState';
import type { Footprint } from '../sim/world/grid';
import { buildingFootprint, occupantAt } from '../sim/world/occupancy';

/** Aktives Werkzeug der Bauleiste. */
export type BuildTool = { kind: 'place'; buildingType: BuildingTypeId } | { kind: 'demolish' };

/** Was das Werkzeug an der Mausposition tun würde (für Geisterbild, Tooltip und Klick). */
export type BuildPreview =
  | {
      kind: 'place';
      footprint: Footprint;
      height: number;
      costCents: number;
      reason: BuildRejection | null;
      command: Command;
    }
  | {
      kind: 'demolish';
      footprint: Footprint;
      height: number;
      refundCents: number;
      command: Command;
    }
  | { kind: 'nothingToDemolish' };

/**
 * Berechnet die Vorschau für einen Punkt auf dem Boden (Weltkoordinaten = Felder).
 * Gebäude werden mittig unter dem Mauszeiger platziert. Nutzt dieselbe Prüfung wie der Befehl,
 * daher stimmt „grün“ immer mit „wird gebaut“ überein.
 */
export function previewAt(
  state: GameState,
  tool: BuildTool,
  worldX: number,
  worldZ: number,
): BuildPreview {
  if (tool.kind === 'place') {
    const type = buildingTypes[tool.buildingType];
    const x = Math.round(worldX - type.width / 2);
    const z = Math.round(worldZ - type.depth / 2);
    const check = checkPlaceBuilding(state, tool.buildingType, x, z);
    return {
      kind: 'place',
      footprint: { x, z, width: type.width, depth: type.depth },
      height: type.height,
      costCents: check.costCents,
      reason: check.ok ? null : check.reason,
      command: { type: 'build/place', buildingType: tool.buildingType, x, z },
    };
  }
  const id = occupantAt(state, Math.floor(worldX), Math.floor(worldZ));
  const building = state.buildings.find((b) => b.id === id);
  if (!building) return { kind: 'nothingToDemolish' };
  return {
    kind: 'demolish',
    footprint: buildingFootprint(building),
    height: buildingTypes[building.type].height,
    refundCents: demolishRefund(state, building.builtTick, building.paidCents),
    command: { type: 'build/demolish', buildingId: building.id },
  };
}
