import type { Footprint } from './grid';
import type { Cell } from './roadLine';
import type { RoadNetwork } from './roadNetwork';
import { partsOf, shapeBounds, shapeContains, type Shape } from './zoneShape';

/** Seite einer Fläche: Nord (−z), Ost (+x), Süd (+z), West (−x). */
export const SIDES = ['N', 'E', 'S', 'W'] as const;
export type Side = (typeof SIDES)[number];

function besideRect(f: Footprint, side: Side): Cell[] {
  const cells: Cell[] = [];
  if (side === 'N' || side === 'S') {
    const z = side === 'N' ? f.z - 1 : f.z + f.depth;
    for (let x = f.x; x < f.x + f.width; x++) cells.push({ x, z });
  } else {
    const x = side === 'W' ? f.x - 1 : f.x + f.width;
    for (let z = f.z; z < f.z + f.depth; z++) cells.push({ x, z });
  }
  return cells;
}

/**
 * Felder direkt vor einer Seite (außerhalb der Fläche), von der Mitte nach außen sortiert,
 * damit die Zufahrt möglichst mittig am Tor liegt. Bei verschmolzenen Zonen zählen alle
 * Teile, deren Kante auf dieser Seite frei liegt.
 */
export function cellsBeside(shape: Shape, side: Side): Cell[] {
  const cells = partsOf(shape)
    .flatMap((p) => besideRect(p, side))
    .filter((c) => !shapeContains(shape, c.x, c.z));
  const b = shapeBounds(shape);
  const horizontal = side === 'N' || side === 'S';
  const mid = horizontal ? b.x + (b.width - 1) / 2 : b.z + (b.depth - 1) / 2;
  return cells
    .map((c, i) => ({ c, d: Math.abs((horizontal ? c.x : c.z) - mid), i }))
    .sort((a, b2) => a.d - b2.d || a.i - b2.i)
    .map((e) => e.c);
}

/**
 * Zufahrt: das Straßenfeld vor der Tor-Seite (Entscheidung 07.10.2026: je Zone eine Tor-Seite,
 * über die LKW ein- und ausfahren). null = nicht angeschlossen.
 */
export function accessCell(network: RoadNetwork, shape: Shape, gate: Side): Cell | null {
  return cellsBeside(shape, gate).find((c) => network.has(c.x, c.z)) ?? null;
}

/** Vorschlag für die Tor-Seite: die erste Seite mit angrenzender Straße, sonst Süden. */
export function suggestGate(network: RoadNetwork, shape: Shape): Side {
  return SIDES.find((side) => accessCell(network, shape, side) !== null) ?? 'S';
}
