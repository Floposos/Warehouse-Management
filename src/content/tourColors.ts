/**
 * Farben der Touren (T2.1). Der Spielstand speichert nur den Index.
 * ANNAHME (08.10.2026): 10 gut unterscheidbare Farben; Automatik-Fahrten in Grau.
 */
export const tourColors: readonly number[] = [
  0xe5484d, // Rot
  0x2f80ed, // Blau
  0x30a46c, // Grün
  0xf5a524, // Orange
  0x8e4ec6, // Violett
  0x12a5b8, // Türkis
  0xe93d82, // Pink
  0x8a6d3b, // Braun
  0x9bc53d, // Hellgrün
  0x1f2d5c, // Dunkelblau
];

/** Wegfarbe der Automatik-Fahrten und der Zulieferer. */
export const autoRouteColor = 0x8a94a0;
