import { buildingTypes, type BuildingTypeId } from '../content/buildings';
import { checkPlaceBuilding, demolishRefund, type BuildRejection } from '../sim/commands/build';
import type { Command } from '../sim/commands/commands';
import { checkBuildRoad, roadRefundAt } from '../sim/commands/roads';
import type { GameState } from '../sim/state/gameState';
import type { Footprint } from '../sim/world/grid';
import { buildingFootprint, occupantAt, ROAD_CELL } from '../sim/world/occupancy';
import { prefersXFirst, roadLine, type Cell } from '../sim/world/roadLine';

/** Aktives Werkzeug der Bauleiste. */
export type BuildTool =
  { kind: 'place'; buildingType: BuildingTypeId } | { kind: 'road' } | { kind: 'demolish' };

/** Höhe des Geisterbilds eines Straßenfelds. */
export const ROAD_GHOST_HEIGHT = 0.12;

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
      kind: 'road';
      cells: Cell[];
      blocked: Cell[];
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
 * Gebäude werden mittig unter dem Mauszeiger platziert; Straßen laufen von `dragStart`
 * (Feld beim Drücken) bis zum Feld unter der Maus. Nutzt dieselbe Prüfung wie der Befehl,
 * daher stimmt „grün“ immer mit „wird gebaut“ überein.
 */
export function previewAt(
  state: GameState,
  tool: BuildTool,
  worldX: number,
  worldZ: number,
  dragStart: Cell | null = null,
): BuildPreview {
  const cell = { x: Math.floor(worldX), z: Math.floor(worldZ) };
  switch (tool.kind) {
    case 'place':
      return placePreview(state, tool.buildingType, worldX, worldZ);
    case 'road':
      return roadPreview(state, dragStart ?? cell, cell);
    case 'demolish':
      return demolishPreview(state, cell);
  }
}

function placePreview(
  state: GameState,
  buildingType: BuildingTypeId,
  worldX: number,
  worldZ: number,
): BuildPreview {
  const type = buildingTypes[buildingType];
  const x = Math.round(worldX - type.width / 2);
  const z = Math.round(worldZ - type.depth / 2);
  const check = checkPlaceBuilding(state, buildingType, x, z);
  return {
    kind: 'place',
    footprint: { x, z, width: type.width, depth: type.depth },
    height: type.height,
    costCents: check.costCents,
    reason: check.ok ? null : check.reason,
    command: { type: 'build/place', buildingType, x, z },
  };
}

function roadPreview(state: GameState, from: Cell, to: Cell): BuildPreview {
  const xFirst = prefersXFirst(from, to);
  const check = checkBuildRoad(state, from, to, xFirst);
  return {
    kind: 'road',
    cells: roadLine(from, to, xFirst),
    blocked: check.ok ? [] : check.blocked,
    costCents: check.costCents,
    reason: check.ok ? null : check.reason,
    command: { type: 'road/build', fromX: from.x, fromZ: from.z, toX: to.x, toZ: to.z, xFirst },
  };
}

function demolishPreview(state: GameState, cell: Cell): BuildPreview {
  const id = occupantAt(state, cell.x, cell.z);
  if (id === ROAD_CELL) {
    return {
      kind: 'demolish',
      footprint: { x: cell.x, z: cell.z, width: 1, depth: 1 },
      height: ROAD_GHOST_HEIGHT,
      refundCents: roadRefundAt(state, cell.x, cell.z) ?? 0,
      command: { type: 'road/demolish', x: cell.x, z: cell.z },
    };
  }
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
