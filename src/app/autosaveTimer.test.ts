import { describe, expect, it } from 'vitest';
import { AutosaveTimer } from './autosaveTimer';

function setup(needsReminder = true) {
  const calls = { autosave: 0, remind: 0 };
  const timer = new AutosaveTimer({
    intervalMs: () => 5 * 60_000,
    reminderMs: 30 * 60_000,
    autosave: () => void calls.autosave++,
    remind: () => void calls.remind++,
    needsReminder: () => needsReminder,
  });
  return { timer, calls };
}

describe('AutosaveTimer', () => {
  it('speichert alle 5 Minuten', () => {
    const { timer, calls } = setup();
    for (let s = 0; s < 15 * 60; s++) timer.advance(1000);
    expect(calls.autosave).toBe(3);
  });

  it('erinnert alle 30 Minuten ans Exportieren, ein Export setzt zurück', () => {
    const { timer, calls } = setup();
    for (let s = 0; s < 29 * 60; s++) timer.advance(1000);
    timer.exported();
    for (let s = 0; s < 29 * 60; s++) timer.advance(1000);
    expect(calls.remind).toBe(0);
    for (let s = 0; s < 60; s++) timer.advance(1000);
    expect(calls.remind).toBe(1);
  });

  it('erinnert nicht, wenn eine Sicherungsdatei aktiv ist', () => {
    const { timer, calls } = setup(false);
    timer.advance(31 * 60_000);
    expect(calls.remind).toBe(0);
  });

  it('erkennt, ob seit dem letzten Speichern Zeit vergangen ist', () => {
    const { timer } = setup();
    timer.reset(10);
    expect(timer.hasProgress(10)).toBe(false);
    expect(timer.hasProgress(11)).toBe(true);
    timer.saved(11);
    expect(timer.hasProgress(11)).toBe(false);
  });
});
