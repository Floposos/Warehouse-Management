/**
 * Fahrzeuge. Geschwindigkeit in Tausendstel Feld je Simulationsschritt (400 = 4 Felder je
 * Sekunde bei 1x). ANNAHME: Werte sind Platzhalter bis zum Balancing.
 */
export const vehicleConfig = {
  supplierSpeed: 400,
  /**
   * Eigene LKW (T1.5). Entscheidung 07.10.2026: Kaufpreis + feste Tageskosten + Kilometerkosten.
   * Feinjustierung nach dem M1-Test (Florian, 07.10.2026): Kosten und Tempo „Mittel“.
   */
  truckSpeed: 400,
  /** Ladung je Fahrt (Einheiten). */
  truckCapacity: 20,
  /** Kaufpreis (90.000 €), Tageskosten (400 €), Kosten je km (1,20 €). */
  truckPriceCents: 9_000_000,
  truckDailyCents: 40_000,
  truckCostPerKmCents: 120,
  /** Länge eines Felds in Metern (für die Kilometerkosten). */
  metersPerField: 10,
  /** Automatik: Mindestmenge je Fahrt, damit der LKW nicht für jede Einheit losfährt. */
  truckMinLoad: 5,
  /** Automatik: so oft sucht ein wartender LKW nach Arbeit (Schritte). */
  truckIdleCheckTicks: 25,
  /** Höchstzahl der Halte einer festen Tour. */
  tourMaxStops: 12,
  /** Höchstlänge eines Tour-Namens (Zeichen). */
  tourNameMaxLength: 30,
  /** Abladen bzw. Aufladen je Halt (Schritte). */
  handlingTicks: 30,
  /** Wartezeit, bevor ein Fahrzeug ohne Weg oder ein Auftrag ohne Platz es erneut versucht. */
  retryTicks: 125,
  /** Felder der Eingangsstraße, auf denen Zulieferer außerhalb des Geländes fahren. */
  outsideCells: 12,
} as const;
