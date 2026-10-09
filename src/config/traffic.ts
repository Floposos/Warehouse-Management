/**
 * Verkehr auf dem Campus (M2). Entscheidungen 08.10.2026: Vorfahrtsstraßen markieren,
 * bei Blockaden warnen und Umweg suchen, Stellplätze wachsen mit der Zonengröße.
 * ANNAHME: alle Zahlen sind Platzhalter bis zum Balancing.
 */
export const trafficConfig = {
  /** Stellplätze am Tor: einer je so viele Felder Zonenfläche (mindestens einer). */
  fieldsPerBay: 6,
  /** Höchstzahl Stellplätze je Tor. */
  maxBays: 8,
  /** Stellplätze an der Export-Ausfahrt. */
  exportBays: 3,
  /** So lange (Schritte) steht ein Fahrzeug im Stau, bevor es einen Umweg sucht … */
  detourAfterTicks: 60,
  /** … und danach in diesem Abstand erneut. */
  detourEveryTicks: 50,
  /** Ab so vielen Schritten Wartezeit gilt es als Stau: Warnsymbol und Meldung. */
  jamWarnTicks: 200,
  /** Baukosten fürs Markieren als Vorfahrtsstraße je Feld (Cent). ANNAHME: kostenlos. */
  priorityCostCents: 0,
} as const;
