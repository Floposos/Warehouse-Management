/**
 * Bauen und Abreißen. Geld in Cent.
 * Entscheidungen 07.10.2026: Abriss am selben Spieltag 100 % Erstattung, danach 50 %;
 * Baukosten je Feld, Straße mit eigenem Preis. Feinjustierung nach dem M1-Test
 * (Florian, 07.10.2026): Baupreise „Mittel“.
 */
export const buildConfig = {
  refundSameDay: 1,
  refundLater: 0.5,
  /** Baukosten je Gebäudetyp. */
  buildingCostCents: {
    testHall: 5_000_000,
    exportExit: 5_000_000,
  },
  /** Straße je Feld (500 €). */
  roadCostPerTileCents: 50_000,
} as const;
