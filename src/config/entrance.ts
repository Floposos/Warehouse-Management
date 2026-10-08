/**
 * Einfahrt und externer Verkehr (T2.7). Entscheidung 08.10.2026: Rushhour „spürbar“, morgens
 * und abends deutlich längere Wartezeiten an der Einfahrt.
 * ANNAHME (im M2-Plan genannt): Rushhour 7–9 und 16–18 Uhr, etwa dreifache Wartezeit, mit
 * einer Stunde sanftem Übergang. Wartezeiten in Schritten (10 = 1 s bei 1x).
 */
export const entranceConfig = {
  /** Einfädeln an der Einfahrt (rein wie raus): so lange wartet ein Fahrzeug außerhalb der Rushhour. */
  baseMergeTicks: 10,
  /** Faktor in der Rushhour (Prozent). */
  rushFactorPercent: 300,
  /** Rushhour-Zeiten [von, bis] in vollen Stunden. */
  rushHours: [
    [7, 9],
    [16, 18],
  ] as readonly (readonly [number, number])[],
  /** Übergang vor und nach der Rushhour (Minuten). */
  rampMinutes: 60,
  /** Externe Autos auf der Bundesstraße (nur Darstellung): so viele je Richtung ohne bzw. mit Rushhour. */
  externalCars: 4,
  externalCarsRush: 12,
} as const;
