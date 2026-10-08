import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseSave } from '../format';
import { migrateV3ToV4 } from './v3-to-v4';

const stop = { siteId: 2, action: 'load', product: 'rawA' };
const truck = (id: number, mode: string, tour: unknown[]) => ({ id, kind: 'truck', mode, tour });

describe('Migration v3 → v4', () => {
  it('macht aus den Touren je LKW eigene Touren mit Farbe', () => {
    const v3 = {
      saveVersion: 3,
      state: {
        nextId: 20,
        vehicles: [
          truck(5, 'tour', [stop]),
          truck(6, 'auto', []),
          truck(7, 'auto', [stop]),
          { id: 8, kind: 'supplier' },
        ],
      },
    };
    const state = migrateV3ToV4(v3)['state'] as Record<string, unknown>;
    expect(state['nextId']).toBe(22);
    expect(state['tours']).toEqual([
      { id: 20, name: 'Tour 1', color: 0, stops: [stop] },
      { id: 21, name: 'Tour 2', color: 1, stops: [stop] },
    ]);
    expect(state['vehicles']).toEqual([
      { id: 5, kind: 'truck', tourId: 20 },
      { id: 6, kind: 'truck', tourId: null },
      { id: 7, kind: 'truck', tourId: null },
      { id: 8, kind: 'supplier' },
    ]);
  });

  it('der Beispiel-Spielstand v3 lädt', () => {
    const text = readFileSync(
      new URL('../../../tests/fixtures/saves/v3-beispiel.json', import.meta.url),
      'utf8',
    );
    const result = parseSave(text);
    if (!result.ok) throw new Error(result.error);
    expect(Array.isArray(result.save.state.tours)).toBe(true);
  });
});
