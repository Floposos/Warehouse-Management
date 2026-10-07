/**
 * Fahrzeuge. Geschwindigkeit in Tausendstel Feld je Simulationsschritt (400 = 4 Felder je
 * Sekunde bei 1x). ANNAHME: Werte sind Platzhalter bis zum Balancing.
 */
export const vehicleConfig = {
  supplierSpeed: 400,
  /** Abladen bzw. Aufladen je Halt (Schritte). */
  handlingTicks: 20,
  /** Wartezeit, bevor ein Fahrzeug ohne Weg oder ein Auftrag ohne Platz es erneut versucht. */
  retryTicks: 125,
  /** Felder der Eingangsstraße, auf denen Zulieferer außerhalb des Geländes fahren. */
  outsideCells: 12,
} as const;
