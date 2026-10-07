import type { Footprint } from './grid';

/** Fläche aus einem oder mehreren Rechtecken (verschmolzene Zone). Teile überlappen nie. */
export type Shape = Footprint | readonly Footprint[];

export function partsOf(shape: Shape): readonly Footprint[] {
  return Array.isArray(shape) ? shape : [shape as Footprint];
}

export function shapeArea(shape: Shape): number {
  return partsOf(shape).reduce((sum, p) => sum + p.width * p.depth, 0);
}

export function shapeContains(shape: Shape, x: number, z: number): boolean {
  return partsOf(shape).some((p) => x >= p.x && x < p.x + p.width && z >= p.z && z < p.z + p.depth);
}

/** Umgebendes Rechteck (für Beschriftung und Positionen). */
export function shapeBounds(shape: Shape): Footprint {
  const parts = partsOf(shape);
  const x = Math.min(...parts.map((p) => p.x));
  const z = Math.min(...parts.map((p) => p.z));
  const width = Math.max(...parts.map((p) => p.x + p.width)) - x;
  const depth = Math.max(...parts.map((p) => p.z + p.depth)) - z;
  return { x, z, width, depth };
}

/** Mitte der Fläche (Mittelpunkt des größten Teils, liegt sicher auf der Fläche). */
export function shapeCenter(shape: Shape): { x: number; z: number } {
  const parts = partsOf(shape);
  const largest = parts.reduce((a, b) => (b.width * b.depth > a.width * a.depth ? b : a));
  return { x: largest.x + largest.width / 2, z: largest.z + largest.depth / 2 };
}

/** Teilen zwei Rechtecke eine Kante (nicht nur eine Ecke)? */
function sharesEdge(a: Footprint, b: Footprint): boolean {
  const overlapX = a.x < b.x + b.width && b.x < a.x + a.width;
  const overlapZ = a.z < b.z + b.depth && b.z < a.z + a.depth;
  const touchX = a.x + a.width === b.x || b.x + b.width === a.x;
  const touchZ = a.z + a.depth === b.z || b.z + b.depth === a.z;
  return (touchX && overlapZ) || (touchZ && overlapX);
}

/** Grenzt das Rechteck mit einer Kante an die Fläche? */
export function touchesShape(shape: Shape, rect: Footprint): boolean {
  return partsOf(shape).some((p) => sharesEdge(p, rect));
}
