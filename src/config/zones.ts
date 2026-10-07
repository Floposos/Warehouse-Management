/**
 * Zonen (Lieferorte A, B, C).
 * Entscheidungen 07.10.2026: keine Mindestgröße (1 × 1 genügt); Kapazität skaliert mit der
 * Fläche, je Ware getrennt; Baukosten je Feld, je Zonenart unterschiedlich.
 * Feinjustierung nach dem M1-Test (Florian, 07.10.2026): Baupreise „Mittel“.
 */
export const zoneConfig = {
  /** Mindestbreite und -tiefe in Feldern. */
  minSize: 1,
  /** Baukosten je Feld in Cent (A 250 €, B 400 €, C 400 €). */
  costPerFieldCents: { A: 25_000, B: 40_000, C: 40_000 },
  /** Lagerplatz je Feld und Ware (Einheiten). */
  capacityPerField: 10,
} as const;
