import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Simulation } from '../sim/core/simulation';
import { parseSave } from './format';

/**
 * Lädt jeden Beispiel-Spielstand aus tests/fixtures/saves/ (einer je saveVersion).
 * So fällt sofort auf, wenn ein Update alte Spielstände unlesbar macht.
 */
const dir = new URL('../../tests/fixtures/saves/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

describe('Beispiel-Spielstände', () => {
  it('es gibt mindestens den Spielstand v1', () => {
    expect(files).toContain('v1-beispiel.json');
  });

  it.each(files)('%s lädt und läuft weiter', (file) => {
    const result = parseSave(readFileSync(new URL(file, dir), 'utf8'));
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    const sim = new Simulation(result.save.state);
    const tick = sim.state.tick;
    sim.run(100);
    expect(sim.state.tick).toBe(tick + 100);
  });
});
