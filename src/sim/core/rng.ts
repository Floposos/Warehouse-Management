/**
 * Zufallsgenerator mit Seed (Mulberry32). Der Zustand ist eine einzige 32-Bit-Zahl,
 * liegt im Spielzustand und wird mitgespeichert. Gleicher Seed = gleiche Folge.
 */
export interface RngState {
  /** Aktueller interner Zustand (vorzeichenlose 32-Bit-Zahl). */
  s: number;
}

export function createRngState(seed: number): RngState {
  return { s: seed >>> 0 };
}

/** Liefert eine Zahl in [0, 1) und schreitet den Zustand fort. */
export function nextFloat(rng: RngState): number {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Ganze Zahl in [min, max] (beide eingeschlossen). */
export function nextInt(rng: RngState, min: number, max: number): number {
  return min + Math.floor(nextFloat(rng) * (max - min + 1));
}
