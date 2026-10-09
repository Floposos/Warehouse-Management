import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Simulation } from '../../sim/core/simulation';
import { CURRENT_SAVE_VERSION, parseSave } from '../format';
import { migrateV2ToV3 } from './v2-to-v3';

describe('Migration v2 → v3', () => {
  it('macht aus jeder Zone eine Zone mit genau einem Teil', () => {
    const zone = { id: 3, kind: 'A', x: 4, z: 62, width: 4, depth: 3, gate: 'N' };
    const v2 = { saveVersion: 2, state: { zones: [{ ...zone, builtTick: 9, paidCents: 120 }] } };
    expect(migrateV2ToV3(v2)).toEqual({
      saveVersion: 2,
      state: {
        zones: [
          {
            id: 3,
            kind: 'A',
            gate: 'N',
            parts: [{ x: 4, z: 62, width: 4, depth: 3, builtTick: 9, paidCents: 120 }],
          },
        ],
      },
    });
  });

  it('der Beispiel-Spielstand aus 0.2.0 lädt, und daneben bauen verschmilzt', () => {
    const text = readFileSync(
      new URL('../../../tests/fixtures/saves/v2-beispiel.json', import.meta.url),
      'utf8',
    );
    const result = parseSave(text);
    if (!result.ok) throw new Error(result.error);
    expect(result.save.saveVersion).toBe(CURRENT_SAVE_VERSION);
    const sim = new Simulation(result.save.state);
    const a = sim.state.zones.find((z) => z.kind === 'A');
    const part = a?.parts[0];
    if (!a || !part) throw new Error('Zone A fehlt');
    const x = part.x + part.width;
    expect(
      sim.execute({ type: 'zone/place', kind: 'A', fromX: x, fromZ: part.z, toX: x, toZ: part.z }),
    ).toEqual({ ok: true });
    expect(sim.state.zones.filter((z) => z.kind === 'A')).toHaveLength(1);
    expect(a.parts).toHaveLength(2);
  });
});
