import { buildingTypes } from '../../content/buildings';
import type { Building, GameState } from '../state/gameState';
import { GRID_DEPTH, GRID_WIDTH, footprintCells, type Footprint } from './grid';

/** Grundfläche eines Gebäudes. */
export function buildingFootprint(b: Pick<Building, 'type' | 'x' | 'z'>): Footprint {
  const type = buildingTypes[b.type];
  return { x: b.x, z: b.z, width: type.width, depth: type.depth };
}

/** Belegungswert eines Straßenfelds (Gebäude tragen ihre ID > 0). */
export const ROAD_CELL = -1;

/**
 * Belegung des Rasters: je Feld die ID des Objekts darauf, ROAD_CELL oder 0.
 * Wird aus dem Zustand abgeleitet (nicht gespeichert), damit sie nie abweicht.
 */
export function buildOccupancy(state: GameState): Int32Array {
  const grid = new Int32Array(GRID_WIDTH * GRID_DEPTH);
  for (const b of state.buildings) {
    for (const cell of footprintCells(buildingFootprint(b))) grid[cell] = b.id;
  }
  for (const zone of state.zones) {
    for (const part of zone.parts) for (const cell of footprintCells(part)) grid[cell] = zone.id;
  }
  for (const r of state.roads) grid[r.z * GRID_WIDTH + r.x] = ROAD_CELL;
  return grid;
}

/** ID des Objekts auf einem Feld, ROAD_CELL oder 0. */
export function occupantAt(state: GameState, x: number, z: number): number {
  if (x < 0 || z < 0 || x >= GRID_WIDTH || z >= GRID_DEPTH) return 0;
  return buildOccupancy(state)[z * GRID_WIDTH + x] ?? 0;
}

export function isFree(grid: Int32Array, f: Footprint): boolean {
  return footprintCells(f).every((cell) => grid[cell] === 0);
}
