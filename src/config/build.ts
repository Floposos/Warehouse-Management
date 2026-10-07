/** Bauen und Abreißen. */
export const buildConfig = {
  /** Entscheidung 07.10.2026: Abriss am selben Spieltag 100 % Erstattung, danach 50 %. */
  refundSameDay: 1,
  refundLater: 0.5,
  /**
   * Baukosten je Gebäudetyp in Cent.
   * ANNAHME: Platzhalter, bis Florian die Balancing-Richtung für M1 festlegt.
   */
  buildingCostCents: {
    testHall: 5_000_000,
  },
} as const;
