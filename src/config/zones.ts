/**
 * Zonen (Lieferorte A, B, C).
 * Entscheidungen 07.10.2026: keine Mindestgröße (1 × 1 genügt); Kapazität skaliert mit der
 * Fläche, je Ware getrennt; Baukosten je Feld, je Zonenart unterschiedlich.
 * Euro-Werte und Lagerplatz sind Balancing-Platzhalter, Florian justiert nach dem M1-Test.
 */
export const zoneConfig = {
  /** Mindestbreite und -tiefe in Feldern. */
  minSize: 1,
  /** Baukosten je Feld in Cent (A 100 €, B 150 €, C 150 €). */
  costPerFieldCents: { A: 10_000, B: 15_000, C: 15_000 },
  /** Lagerplatz je Feld und Ware (Einheiten). */
  capacityPerField: 10,
} as const;
