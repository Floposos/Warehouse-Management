/** Gelände. Entscheidung 07.10.2026: Startgelände 128 × 128 Felder (1 Feld = Straßenbreite). */
export const worldConfig = {
  campusWidth: 128,
  campusDepth: 128,
  /** Länge der angedeuteten Eingangsstraße außerhalb des Geländes (Felder). */
  entranceRoadLength: 24,
  /** Feldreihe der Einfahrt am Westrand: Die Eingangsstraße endet vor Feld (0, entranceZ). */
  entranceZ: 61,
} as const;
