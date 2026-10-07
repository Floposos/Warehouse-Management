/**
 * Bauen und Abreißen. Geld in Cent.
 * Entscheidungen 07.10.2026: Abriss am selben Spieltag 100 % Erstattung, danach 50 %;
 * Baukosten je Feld, Straße mit eigenem Preis. Euro-Werte sind Balancing-Platzhalter
 * („großzügig“), Florian justiert sie nach dem M1-Test.
 */
export const buildConfig = {
  refundSameDay: 1,
  refundLater: 0.5,
  /** Baukosten je Gebäudetyp. */
  buildingCostCents: {
    testHall: 5_000_000,
    exportExit: 2_500_000,
  },
  /** Straße je Feld (200 €). */
  roadCostPerTileCents: 20_000,
} as const;
