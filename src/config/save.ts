/** Speichern und Autosave. */
export const saveConfig = {
  /** Anzahl rotierender Autosave-Backups im Browser-Speicher. */
  backupCount: 3,
  /** Entscheidung 07.10.2026: Export-Erinnerung (ohne Sicherungsdatei) alle 30 Minuten Spielzeit. */
  exportReminderMinutes: 30,
  /** Anzeigedauer der Meldung „Gespeichert“ in ms. */
  savedToastMs: 2000,
  exportReminderToastMs: 12_000,
} as const;
