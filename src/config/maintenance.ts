/**
 * Verschleiß, Werkstatt und Pannen (T2.6). Entscheidungen 08.10.2026: Werkstatt als baubare
 * Zone, Fahrzeuge fahren zur Wartung hin; Panne: Fahrzeug steht einige Spielstunden, blockiert
 * die Spur, dazu Abschleppkosten.
 * ANNAHME (im M2-Plan genannt): Wartung ab 40 % Zustand automatisch, dauert 2 Spielstunden,
 * kostet 800 €, ein Werkstattplatz je angefangene 4 Felder; Panne 3 Spielstunden, 1.500 €,
 * danach +20 Prozentpunkte Zustand. Verschleiß und Pannenrisiko sind Platzhalter bis zum Balancing.
 * Zustand in Tausendstel Prozent (100.000 = 100 %).
 */
export const maintenanceConfig = {
  fullCondition: 100_000,
  /** Verschleiß je gefahrenem Feld (10 m): 4 = 0,4 Prozentpunkte je km. */
  wearPerField: 4,
  /** Unter diesem Zustand fährt das Fahrzeug nach dem laufenden Auftrag zur Werkstatt. */
  serviceBelow: 40_000,
  /** Wartungsdauer (Schritte; 125 = 1 Spielstunde). */
  serviceTicks: 250,
  serviceCostCents: 80_000,
  /** Werkstattplätze: einer je so viele Felder (mindestens einer, höchstens `maxBays`). */
  workshopFieldsPerBay: 4,
  /**
   * Pannenrisiko je km bei Zustand 0 in Millionstel; es fällt quadratisch mit dem Zustand
   * (bei 40 % etwa 1,8 % je km, bei 90 % etwa 0,05 % je km, bei 100 % nie).
   */
  breakdownPerKmAtZeroPpm: 50_000,
  breakdownTicks: 375,
  towCostCents: 150_000,
  /** Zustand nach dem Abschleppen: so viel wird gutgeschrieben (+20 Prozentpunkte). */
  breakdownRepair: 20_000,
} as const;
