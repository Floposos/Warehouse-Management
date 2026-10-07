/** Ein Feld auf dem Raster. */
export interface Cell {
  x: number;
  z: number;
}

/**
 * Felder einer gezogenen Straße von `from` nach `to`: gerade oder mit einem Knick (L-Form).
 * `xFirst` = erst entlang x, dann entlang z. Start und Ziel sind enthalten, keine Doppelten.
 */
export function roadLine(from: Cell, to: Cell, xFirst: boolean): Cell[] {
  const corner = xFirst ? { x: to.x, z: from.z } : { x: from.x, z: to.z };
  const cells = [...segment(from, corner), ...segment(corner, to).slice(1)];
  return cells;
}

function segment(a: Cell, b: Cell): Cell[] {
  const cells: Cell[] = [];
  const dx = Math.sign(b.x - a.x);
  const dz = Math.sign(b.z - a.z);
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.z - a.z));
  for (let i = 0; i <= steps; i++) cells.push({ x: a.x + dx * i, z: a.z + dz * i });
  return cells;
}

/** Knick-Richtung beim Ziehen: zuerst entlang der Achse mit dem größeren Abstand. */
export function prefersXFirst(from: Cell, to: Cell): boolean {
  return Math.abs(to.x - from.x) >= Math.abs(to.z - from.z);
}
