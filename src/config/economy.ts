/** Geldwerte in Cent (ganzzahlig, damit Rechnungen exakt bleiben). */
export const economyConfig = {
  /** Entscheidung 07.10.2026: Startkapital 2.000.000 €. */
  startingBalanceCents: 200_000_000,
  /** So viele letzte Buchungen merkt sich die Kasse (Liste in der Übersicht). */
  recentBookings: 50,
} as const;
