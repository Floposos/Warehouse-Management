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
    const traffic = { heading: 1, offRoad: false, bayAt: null, waitTicks: 0 };
    const fleet = {
      model: 'truck',
      drive: 'diesel',
      priceCents: 9_000_000,
      boughtTick: 0,
      lease: null,
      upkeep: {
        condition: 100_000,
        wearRest: 0,
        brokenTicks: 0,
        breakdowns: 0,
        lastBreakdownTick: null,
        lastServiceTick: null,
        serviceRequested: false,
        warnedNoWorkshop: false,
        workshopId: null,
      },
    };
    expect(state['eventRng']).toEqual({ s: (0 ^ 0x5bd1e995) >>> 0 });
    expect(state['vehicles']).toEqual([
      { id: 5, kind: 'truck', tourId: 20, ...traffic, ...fleet },
      { id: 6, kind: 'truck', tourId: null, ...traffic, ...fleet },
      { id: 7, kind: 'truck', tourId: null, ...traffic, ...fleet },
      { id: 8, kind: 'supplier', ...traffic },
    ]);
  });

  it('Fahrtrichtung aus dem Weg, wartende Fahrzeuge abseits, Straßen ohne Vorfahrt', () => {
    const route = [
      { x: 3, z: 5 },
      { x: 3, z: 4 },
    ];
    const v3 = {
      saveVersion: 3,
      state: {
        nextId: 1,
        roads: [{ x: 1, z: 2 }],
        vehicles: [
          { id: 1, kind: 'supplier', phase: 'toSite', route },
          { id: 2, kind: 'supplier', phase: 'handling', route },
        ],
      },
    };
    const state = migrateV3ToV4(v3)['state'] as Record<string, unknown>;
    expect(state['roads']).toEqual([{ x: 1, z: 2, priority: false }]);
    expect(state['vehicles']).toMatchObject([
      { heading: 0, offRoad: false },
      { heading: 0, offRoad: true },
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
