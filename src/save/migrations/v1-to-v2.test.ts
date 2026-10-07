import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseSave } from '../format';
import { migrateV1ToV2 } from './v1-to-v2';

describe('Migration v1 → v2', () => {
  it('ergänzt Bauzeitpunkt und Preis ohne Erstattungsanspruch', () => {
    const v1 = {
      saveVersion: 1,
      state: { buildings: [{ id: 1, type: 'testHall', x: 12, z: 58 }] },
    };
    expect(migrateV1ToV2(v1)).toEqual({
      saveVersion: 1,
      state: {
        buildings: [{ id: 1, type: 'testHall', x: 12, z: 58, builtTick: 0, paidCents: 0 }],
        roads: [],
      },
    });
  });

  it('lädt den M0-Beispielspielstand mit allen Werten', () => {
    const text = readFileSync(
      new URL('../../../tests/fixtures/saves/v1-beispiel.json', import.meta.url),
      'utf8',
    );
    const result = parseSave(text);
    if (!result.ok) throw new Error(result.error);
    expect(result.save.saveVersion).toBe(2);
    expect(result.save.state.finance.balanceCents).toBe(99_750_000);
    expect(result.save.state.buildings[0]).toMatchObject({
      x: 12,
      z: 58,
      builtTick: 0,
      paidCents: 0,
    });
  });
});
