import { worldConfig } from '../../config/world';
import type { GameState } from '../state/gameState';
import { GRID_DEPTH, GRID_WIDTH } from './grid';
import type { Cell } from './roadLine';

/** Die Einfahrt: virtuelles Straßenfeld direkt westlich vor dem Campus (Eingangsstraße). */
export const ENTRANCE: Cell = { x: -1, z: worldConfig.entranceZ };

/** Richtungen als Bits für Verbindungsstücke: Nord (−z), Ost (+x), Süd (+z), West (−x). */
export const DIRS = [
  { bit: 1, dx: 0, dz: -1 },
  { bit: 2, dx: 1, dz: 0 },
  { bit: 4, dx: 0, dz: 1 },
  { bit: 8, dx: -1, dz: 0 },
] as const;

/** Schlüssel eines Felds; erlaubt den Rand −1 … Breite für die Einfahrt. */
export function cellKey(x: number, z: number): number {
  return (z + 1) * (GRID_WIDTH + 2) + (x + 1);
}

/** Straßennetz, aus dem Zustand abgeleitet (wird nie gespeichert). */
export class RoadNetwork {
  private readonly cells = new Set<number>();

  constructor(state: Pick<GameState, 'roads'>) {
    for (const r of state.roads) this.cells.add(cellKey(r.x, r.z));
    this.cells.add(cellKey(ENTRANCE.x, ENTRANCE.z));
  }

  has(x: number, z: number): boolean {
    if (x < -1 || z < -1 || x > GRID_WIDTH || z > GRID_DEPTH) return false;
    return this.cells.has(cellKey(x, z));
  }

  /** Bitmaske der Nachbarn mit Straße (für die Form: gerade, Kurve, T-Stück, Kreuzung). */
  connections(x: number, z: number): number {
    let mask = 0;
    for (const d of DIRS) if (this.has(x + d.dx, z + d.dz)) mask |= d.bit;
    return mask;
  }

  neighbors(x: number, z: number): Cell[] {
    const result: Cell[] = [];
    for (const d of DIRS) {
      if (this.has(x + d.dx, z + d.dz)) result.push({ x: x + d.dx, z: z + d.dz });
    }
    return result;
  }
}

/** Form eines Straßenfelds aus seiner Verbindungsmaske. */
export type RoadShape = 'single' | 'end' | 'straight' | 'curve' | 'tee' | 'cross';

export function roadShape(mask: number): RoadShape {
  const count = [1, 2, 4, 8].filter((b) => mask & b).length;
  if (count === 0) return 'single';
  if (count === 1) return 'end';
  if (count === 3) return 'tee';
  if (count === 4) return 'cross';
  return mask === 5 || mask === 10 ? 'straight' : 'curve';
}
