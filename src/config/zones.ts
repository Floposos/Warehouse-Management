/**
 * Zonen (Lieferorte A, B, C).
 * Entscheidungen 07.10.2026: keine Mindestgröße (1 × 1 genügt); Kapazität skaliert mit der Fläche;
 * Baukosten je Feld, je Zonenart unterschiedlich.
 * ANNAHME: Euro-Werte und Lagerplatz sind Platzhalter bis zum Balancing.
 */
export const zoneConfig = {
  /** Mindestbreite und -tiefe in Feldern. */
  minSize: 1,
  /** Baukosten je Feld in Cent (A 200 €, B 300 €, C 250 €). */
  costPerFieldCents: { A: 20_000, B: 30_000, C: 25_000 },
  /** Lagerplatz je Feld und Ware (Einheiten). */
  capacityPerField: 10,
} as const;
