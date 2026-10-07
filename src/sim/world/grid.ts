import { worldConfig } from '../../config/world';

/** Rechteck auf dem Raster in Feldern: linke obere Ecke (x, z), Breite, Tiefe. */
export interface Footprint {
  x: number;
  z: number;
  width: number;
  depth: number;
}

export const GRID_WIDTH = worldConfig.campusWidth;
export const GRID_DEPTH = worldConfig.campusDepth;

export function isInsideCampus(f: Footprint): boolean {
  return (
    Number.isInteger(f.x) &&
    Number.isInteger(f.z) &&
    f.x >= 0 &&
    f.z >= 0 &&
    f.x + f.width <= GRID_WIDTH &&
    f.z + f.depth <= GRID_DEPTH
  );
}

export function cellIndex(x: number, z: number): number {
  return z * GRID_WIDTH + x;
}

/** Alle Felder eines Rechtecks als Index. */
export function footprintCells(f: Footprint): number[] {
  const cells: number[] = [];
  for (let z = f.z; z < f.z + f.depth; z++) {
    for (let x = f.x; x < f.x + f.width; x++) cells.push(cellIndex(x, z));
  }
  return cells;
}
