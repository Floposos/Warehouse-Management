import { buildingTypes } from '../../content/buildings';
import type { Building, GameState } from '../state/gameState';
import { GRID_DEPTH, GRID_WIDTH, footprintCells, type Footprint } from './grid';

/** Grundfläche eines Gebäudes. */
export function buildingFootprint(b: Pick<Building, 'type' | 'x' | 'z'>): Footprint {
  const type = buildingTypes[b.type];
  return { x: b.x, z: b.z, width: type.width, depth: type.depth };
}

/**
 * Belegung des Rasters: je Feld die ID des Objekts darauf oder 0.
 * Wird aus dem Zustand abgeleitet (nicht gespeichert), damit sie nie abweicht.
 */
export function buildOccupancy(state: GameState): Int32Array {
  const grid = new Int32Array(GRID_WIDTH * GRID_DEPTH);
  for (const b of state.buildings) {
    for (const cell of footprintCells(buildingFootprint(b))) grid[cell] = b.id;
  }
  return grid;
}

/** ID des Objekts auf einem Feld oder 0. */
export function occupantAt(state: GameState, x: number, z: number): number {
  if (x < 0 || z < 0 || x >= GRID_WIDTH || z >= GRID_DEPTH) return 0;
  return buildOccupancy(state)[z * GRID_WIDTH + x] ?? 0;
}

export function isFree(grid: Int32Array, f: Footprint): boolean {
  return footprintCells(f).every((cell) => grid[cell] === 0);
}
