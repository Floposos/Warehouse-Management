/**
 * Ereignisse und Meldungen (M2, T2.4/T2.6). ANNAHME: Platzhalter bis zum Balancing.
 */
export const eventsConfig = {
  /** So viele Meldungen bleiben in der Liste (ältere fallen heraus). */
  maxNotices: 40,
  /** Gleiche Meldung in der Nähe innerhalb dieser Zeit wird nicht wiederholt (Schritte). */
  noticeMergeTicks: 600,
  /** „In der Nähe“ für das Zusammenfassen (Felder). */
  noticeMergeDistance: 6,
} as const;
