import { describe, expect, it } from 'vitest';
import { SettingsStore, defaultSettings, sanitizeSettings, type KeyValueStorage } from './settings';

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

describe('Einstellungen', () => {
  it('Standard: Autosave alle 5 Minuten', () => {
    expect(defaultSettings().autosaveMinutes).toBe(5);
  });

  it('bleiben nach Neuladen erhalten', () => {
    const storage = memoryStorage();
    new SettingsStore(storage).update({ autosaveMinutes: 10, cameraSensitivity: 1.5 });
    const reloaded = new SettingsStore(storage).get();
    expect(reloaded.autosaveMinutes).toBe(10);
    expect(reloaded.cameraSensitivity).toBe(1.5);
  });

  it('verwirft ungültige Werte', () => {
    const s = sanitizeSettings({ autosaveMinutes: 7, cameraSensitivity: 99, edgeScroll: 'ja' });
    expect(s.autosaveMinutes).toBe(5);
    expect(s.cameraSensitivity).toBe(2.5);
    expect(s.edgeScroll).toBe(true);
  });

  it('übersteht kaputten oder fehlenden Speicher', () => {
    const storage = memoryStorage();
    storage.data.set('logistikum.settings.v1', '{kaputt');
    expect(new SettingsStore(storage).get()).toEqual(defaultSettings());
    const store = new SettingsStore(null);
    store.update({ edgeScroll: false });
    expect(store.get().edgeScroll).toBe(false);
  });
});
