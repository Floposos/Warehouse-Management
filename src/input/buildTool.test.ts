import { describe, expect, it } from 'vitest';
import { buildConfig } from '../config/build';
import { createInitialState } from '../sim/state/gameState';
import { previewAt } from './buildTool';

const place = { kind: 'place', buildingType: 'testHall' } as const;

describe('Bau-Vorschau', () => {
  it('setzt das Gebäude mittig unter den Mauszeiger', () => {
    const p = previewAt(createInitialState(1), place, 44.2, 43.4);
    expect(p).toMatchObject({
      kind: 'place',
      footprint: { x: 40, z: 40, width: 8, depth: 6 },
      reason: null,
      costCents: buildConfig.buildingCostCents.testHall,
    });
  });

  it('zeigt den Grund, wenn nicht gebaut werden kann', () => {
    const state = createInitialState(1);
    expect(previewAt(state, place, 16, 61)).toMatchObject({ reason: 'occupied' });
    expect(previewAt(state, place, 1, 1)).toMatchObject({ reason: 'outOfBounds' });
    state.finance.balanceCents = 0;
    expect(previewAt(state, place, 44, 43)).toMatchObject({ reason: 'insufficientFunds' });
  });

  it('Abriss trifft das Gebäude unter dem Mauszeiger', () => {
    const state = createInitialState(1);
    expect(previewAt(state, { kind: 'demolish' }, 13.5, 59.5)).toMatchObject({
      kind: 'demolish',
      footprints: [{ x: 12, z: 58 }],
      refundCents: 0,
      command: { type: 'build/demolish', buildingId: 1 },
    });
    expect(previewAt(state, { kind: 'demolish' }, 50, 50)).toEqual({ kind: 'nothingToDemolish' });
  });
});

describe('Straßen-Vorschau', () => {
  it('ohne Ziehen ein Feld unter der Maus', () => {
    expect(previewAt(createInitialState(1), { kind: 'road' }, 3.7, 9.2)).toMatchObject({
      kind: 'road',
      cells: [{ x: 3, z: 9 }],
      costCents: buildConfig.roadCostPerTileCents,
      reason: null,
    });
  });

  it('beim Ziehen L-Form vom Startfeld, blockierte Felder markiert', () => {
    const p = previewAt(createInitialState(1), { kind: 'road' }, 14.5, 66.5, { x: 2, z: 60 });
    expect(p).toMatchObject({
      kind: 'road',
      reason: 'occupied',
      command: { type: 'road/build', fromX: 2, fromZ: 60, toX: 14, toZ: 66, xFirst: true },
    });
    if (p.kind !== 'road') return;
    expect(p.cells).toHaveLength(19);
    expect(p.blocked).toEqual([
      { x: 12, z: 60 },
      { x: 13, z: 60 },
      { x: 14, z: 60 },
      { x: 14, z: 61 },
      { x: 14, z: 62 },
      { x: 14, z: 63 },
    ]);
  });

  it('Abriss trifft auch Straßenfelder', () => {
    const state = createInitialState(1);
    state.roads.push({ x: 5, z: 5, builtTick: 0, paidCents: 50_000, priority: false });
    expect(previewAt(state, { kind: 'demolish' }, 5.5, 5.5)).toMatchObject({
      kind: 'demolish',
      refundCents: 50_000,
      command: { type: 'road/demolish', x: 5, z: 5 },
    });
  });
});
