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
      footprint: { x: 12, z: 58 },
      refundCents: 0,
      command: { type: 'build/demolish', buildingId: 1 },
    });
    expect(previewAt(state, { kind: 'demolish' }, 50, 50)).toEqual({ kind: 'nothingToDemolish' });
  });
});
