export interface AutosaveTimerOptions {
  intervalMs(): number;
  reminderMs: number;
  autosave(): void;
  remind(): void;
  /** True, wenn keine Sicherungsdatei aktiv ist (dann Export-Erinnerung). */
  needsReminder(): boolean;
}

/**
 * Zählt Echtzeit im Spiel (auch bei Pause; nicht im Hauptmenü) und löst Autosave
 * im eingestellten Intervall und die Export-Erinnerung alle 30 Minuten aus.
 */
export class AutosaveTimer {
  private sinceSave = 0;
  private sincePlayReminder = 0;
  private lastSavedTick = -1;

  constructor(private readonly options: AutosaveTimerOptions) {}

  /** Mit vergangener Echtzeit aufrufen, solange ein Spiel läuft. */
  advance(realMs: number): void {
    this.sinceSave += realMs;
    this.sincePlayReminder += realMs;
    if (this.sinceSave >= this.options.intervalMs()) {
      this.sinceSave = 0;
      this.options.autosave();
    }
    if (this.sincePlayReminder >= this.options.reminderMs) {
      this.sincePlayReminder = 0;
      if (this.options.needsReminder()) this.options.remind();
    }
  }

  /** Hat sich seit dem letzten Autosave etwas getan? Sonst nicht erneut speichern. */
  hasProgress(tick: number): boolean {
    return tick !== this.lastSavedTick;
  }

  saved(tick: number): void {
    this.lastSavedTick = tick;
  }

  exported(): void {
    this.sincePlayReminder = 0;
  }

  reset(tick: number): void {
    this.sinceSave = 0;
    this.sincePlayReminder = 0;
    this.lastSavedTick = tick;
  }
}
