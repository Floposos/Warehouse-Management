/**
 * Geldwerte in Cent (ganzzahlig, damit Rechnungen exakt bleiben).
 * ANNAHME: Startkapital ist ein Platzhalter für M0. Florian hat „großzügig“ gewählt;
 * der genaue Betrag wird vor M1 beim Balancing festgelegt (DESIGN.md, offene Fragen).
 */
export const economyConfig = {
  startingBalanceCents: 100_000_000,
} as const;
