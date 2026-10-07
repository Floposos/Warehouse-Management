import type { Footprint } from './grid';
import type { Cell } from './roadLine';
import type { RoadNetwork } from './roadNetwork';

/** Seite einer Fläche: Nord (−z), Ost (+x), Süd (+z), West (−x). */
export const SIDES = ['N', 'E', 'S', 'W'] as const;
export type Side = (typeof SIDES)[number];

/**
 * Felder direkt vor einer Seite (außerhalb der Fläche), von der Mitte nach außen sortiert,
 * damit die Zufahrt möglichst mittig am Tor liegt.
 */
export function cellsBeside(f: Footprint, side: Side): Cell[] {
  const cells: Cell[] = [];
  if (side === 'N' || side === 'S') {
    const z = side === 'N' ? f.z - 1 : f.z + f.depth;
    for (let x = f.x; x < f.x + f.width; x++) cells.push({ x, z });
  } else {
    const x = side === 'W' ? f.x - 1 : f.x + f.width;
    for (let z = f.z; z < f.z + f.depth; z++) cells.push({ x, z });
  }
  const mid = (cells.length - 1) / 2;
  return cells
    .map((c, i) => ({ c, d: Math.abs(i - mid), i }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((e) => e.c);
}

/**
 * Zufahrt: das Straßenfeld vor der Tor-Seite (Entscheidung 07.10.2026: je Zone eine Tor-Seite,
 * über die LKW ein- und ausfahren). null = nicht angeschlossen.
 */
export function accessCell(network: RoadNetwork, f: Footprint, gate: Side): Cell | null {
  return cellsBeside(f, gate).find((c) => network.has(c.x, c.z)) ?? null;
}

/** Vorschlag für die Tor-Seite: die erste Seite mit angrenzender Straße, sonst Süden. */
export function suggestGate(network: RoadNetwork, f: Footprint): Side {
  return SIDES.find((side) => accessCell(network, f, side) !== null) ?? 'S';
}
