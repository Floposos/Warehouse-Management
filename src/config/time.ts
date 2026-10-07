/** Zeit und Takt. Entscheidung 07.10.2026: 1 Spieltag = 5 Minuten Echtzeit bei 1x. */
export const timeConfig = {
  /** Echtzeit-Sekunden pro Spieltag bei Geschwindigkeit 1x. */
  realSecondsPerGameDay: 300,
  /** Simulationsschritte pro Echtzeit-Sekunde bei 1x (technischer Wert). */
  ticksPerRealSecond: 10,
  /** Höchstens so viele Schritte pro Bild, damit das Spiel nach Rucklern nicht einfriert. */
  maxTicksPerFrame: 40,
  /** Wählbare Geschwindigkeitsstufen (Entscheidung: 1x/2x/4x). */
  speeds: [1, 2, 4] as const,
  /** Startdatum eines neuen Spiels (Entscheidung 07.10.2026: 1. Januar 2000), 00:00 Uhr. */
  startDate: { year: 2000, month: 1, day: 1 },
} as const;

export type GameSpeed = (typeof timeConfig.speeds)[number];
