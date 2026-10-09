import type { Cell } from '../world/roadLine';
import { DIRS, cellKey } from '../world/roadNetwork';

/** Fahrtrichtung als Index in `DIRS`: 0 Nord (−z), 1 Ost (+x), 2 Süd (+z), 3 West (−x). */
export type Heading = 0 | 1 | 2 | 3;

/** Richtung von `a` zum Nachbarfeld `b`; bei nicht benachbarten Feldern Ost. */
export function headingBetween(a: Cell, b: Cell): Heading {
  const i = DIRS.findIndex((d) => d.dx === b.x - a.x && d.dz === b.z - a.z);
  return (i < 0 ? 1 : i) as Heading;
}

/**
 * Fahrspur: Feld plus Fahrtrichtung, in der das Fahrzeug das Feld befährt. So stören sich
 * Gegenverkehr und Fahrzeuge in Kurven nicht, Fahrzeuge in derselben Richtung schon.
 */
export function laneKey(c: Cell, heading: Heading): number {
  return cellKey(c.x, c.z) * 4 + heading;
}

/** Richtung, in der ein Fahrzeug fährt, das von rechts kommt (Rechts vor links). */
export function fromRight(heading: Heading): Heading {
  return ((heading + 3) % 4) as Heading;
}
