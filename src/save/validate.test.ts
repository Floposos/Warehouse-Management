import { describe, expect, it } from 'vitest';
import { createInitialState } from '../sim/state/gameState';
import { validateState } from './validate';

const zone = {
  id: 2,
  kind: 'A',
  x: 1,
  z: 1,
  width: 2,
  depth: 2,
  gate: 'S',
  builtTick: 0,
  paidCents: 0,
  stock: { rawA: 5 },
};

describe('validateState', () => {
  it('akzeptiert einen frischen Zustand und gültige Zonen', () => {
    expect(validateState(createInitialState(1))).toBe(true);
    expect(validateState({ ...createInitialState(1), zones: [zone] })).toBe(true);
  });

  it('lehnt kaputte Zonen ab', () => {
    const state = createInitialState(1);
    expect(validateState({ ...state, zones: undefined })).toBe(false);
    expect(validateState({ ...state, zones: [{ ...zone, kind: 'X' }] })).toBe(false);
    expect(validateState({ ...state, zones: [{ ...zone, gate: 'Q' }] })).toBe(false);
    expect(validateState({ ...state, zones: [{ ...zone, stock: { gold: 1 } }] })).toBe(false);
    expect(validateState({ ...state, zones: [{ ...zone, width: 1.5 }] })).toBe(false);
  });

  it('lehnt eine kaputte Kasse ab', () => {
    const state = createInitialState(1);
    expect(validateState({ ...state, finance: { balanceCents: 5 } })).toBe(false);
  });
});
