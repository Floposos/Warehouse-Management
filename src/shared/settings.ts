import { settingsConfig } from '../config/settings';

export interface Settings {
  autosaveMinutes: number;
  cameraSensitivity: number;
  edgeScroll: boolean;
}

export const SETTINGS_KEY = 'logistikum.settings.v1';

export function defaultSettings(): Settings {
  return {
    autosaveMinutes: settingsConfig.autosaveMinutesDefault,
    cameraSensitivity: settingsConfig.cameraSensitivityDefault,
    edgeScroll: settingsConfig.edgeScrollDefault,
  };
}

/** Übernimmt nur gültige Werte; alles andere fällt auf den Standard zurück. */
export function sanitizeSettings(raw: unknown): Settings {
  const result = defaultSettings();
  if (typeof raw !== 'object' || raw === null) return result;
  const r = raw as Record<string, unknown>;
  const options: readonly number[] = settingsConfig.autosaveMinutesOptions;
  if (typeof r['autosaveMinutes'] === 'number' && options.includes(r['autosaveMinutes'])) {
    result.autosaveMinutes = r['autosaveMinutes'];
  }
  const s = r['cameraSensitivity'];
  if (typeof s === 'number' && Number.isFinite(s)) {
    result.cameraSensitivity = Math.min(
      settingsConfig.cameraSensitivityMax,
      Math.max(settingsConfig.cameraSensitivityMin, s),
    );
  }
  if (typeof r['edgeScroll'] === 'boolean') result.edgeScroll = r['edgeScroll'];
  return result;
}

/** Minimaler Speicher (localStorage oder Test-Ersatz). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Lädt und speichert Einstellungen; Fehler (z. B. gesperrter Speicher) brechen nichts. */
export class SettingsStore {
  private current: Settings;

  constructor(private readonly storage: KeyValueStorage | null) {
    this.current = this.load();
  }

  private load(): Settings {
    try {
      const text = this.storage?.getItem(SETTINGS_KEY);
      return sanitizeSettings(text ? JSON.parse(text) : null);
    } catch {
      return defaultSettings();
    }
  }

  get(): Readonly<Settings> {
    return this.current;
  }

  update(changes: Partial<Settings>): void {
    this.current = sanitizeSettings({ ...this.current, ...changes });
    try {
      this.storage?.setItem(SETTINGS_KEY, JSON.stringify(this.current));
    } catch {
      // Speicher nicht verfügbar: Einstellung gilt nur bis zum Neuladen.
    }
  }
}
