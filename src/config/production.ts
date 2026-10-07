/**
 * Verarbeitung in den Lieferorten. Dauer in Simulationsschritten
 * (1 Schritt = 28,8 Spielsekunden; 125 Schritte = 1 Spielstunde).
 * Entscheidung 07.10.2026: In C steigt der Durchsatz mit der Zonengröße.
 * Werte sind Balancing-Platzhalter, Florian justiert nach dem M1-Test.
 */
export const productionConfig = {
  /** B: 1 Rohware A + 1 Rohware B → 1 Kombi, feste Dauer je Einheit. */
  comboTicksPerUnit: 60,
  /**
   * C: 1 Kombi → 1 Endprodukt. Arbeit je Einheit in „Feld-Schritten“: jedes Feld der Zone
   * leistet 1 je Schritt (3 × 3 = 9 Felder → 405 / 9 = 45 Schritte je Einheit).
   */
  finalWorkPerUnit: 405,
} as const;
