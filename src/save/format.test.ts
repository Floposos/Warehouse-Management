import { describe, expect, it } from 'vitest';
import { Simulation } from '../sim/core/simulation';
import { createInitialState } from '../sim/state/gameState';
import { CURRENT_SAVE_VERSION, createSave, parseSave, serializeSave } from './format';

function playedState() {
  const sim = new Simulation(createInitialState(42));
  sim.submit({ type: 'finance/adjustBalance', deltaCents: -12_345 });
  sim.run(4321);
  return sim.state;
}

describe('Spielstand-Format', () => {
  it('Speichern und Laden ergibt einen identischen Zustand', () => {
    const state = playedState();
    const text = serializeSave(
      createSave(state, 'Test', '0.1.0', new Date('2026-10-07T12:00:00Z')),
    );
    const result = parseSave(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.save.state).toEqual(state);
    expect(result.save.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(result.save.meta).toEqual({
      name: 'Test',
      tick: 4321,
      balanceCents: state.finance.balanceCents,
    });
  });

  it('geladener Stand rechnet exakt gleich weiter', () => {
    const state = playedState();
    const loaded = parseSave(serializeSave(createSave(state, 'x', '0.1.0', new Date())));
    if (!loaded.ok) throw new Error('nicht geladen');
    const a = new Simulation(state);
    const b = new Simulation(loaded.save.state);
    a.run(1000);
    b.run(1000);
    expect(b.state).toEqual(a.state);
  });

  it('der Spielstand ist eine Kopie, spätere Änderungen wirken nicht hinein', () => {
    const state = playedState();
    const save = createSave(state, 'x', '0.1.0', new Date());
    state.tick = 0;
    expect(save.state.tick).toBe(4321);
  });

  it('gibt verständliche Fehlercodes statt abzustürzen', () => {
    const valid = JSON.parse(
      serializeSave(createSave(playedState(), 'x', '0.1.0', new Date())),
    ) as Record<string, unknown>;
    const variant = (changes: Record<string, unknown>): string =>
      JSON.stringify({ ...valid, ...changes });
    expect(parseSave('kein json')).toEqual({ ok: false, error: 'notJson' });
    expect(parseSave('[]')).toEqual({ ok: false, error: 'wrongFormat' });
    expect(parseSave(variant({ format: 'anderes-spiel' }))).toEqual({
      ok: false,
      error: 'wrongFormat',
    });
    expect(parseSave(variant({ saveVersion: CURRENT_SAVE_VERSION + 1 }))).toEqual({
      ok: false,
      error: 'tooNew',
    });
    expect(parseSave(variant({ saveVersion: 'eins' }))).toEqual({
      ok: false,
      error: 'invalidVersion',
    });
    expect(parseSave(variant({ state: { tick: -1 } }))).toEqual({
      ok: false,
      error: 'invalidState',
    });
  });
});
