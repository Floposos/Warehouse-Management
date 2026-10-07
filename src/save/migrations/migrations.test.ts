import { describe, expect, it } from 'vitest';
import { migrateSave, type Migration } from './index';

/** Beispiel-Kette v1 → v2 → v3, wie sie künftige Versionen nutzen. */
const example: Record<number, Migration> = {
  1: (save) => ({ ...save, state: { ...(save['state'] as object), money: 5 } }),
  2: (save) => {
    const state = save['state'] as { money: number };
    return { ...save, state: { ...state, money: state.money * 100 } };
  },
};

describe('migrateSave', () => {
  it('wendet alle Schritte der Reihe nach an und setzt die Version', () => {
    const result = migrateSave({ saveVersion: 1, state: {} }, 3, example);
    expect(result).toEqual({ saveVersion: 3, state: { money: 500 } });
  });

  it('lässt aktuelle Stände unverändert', () => {
    const save = { saveVersion: 3, state: { a: 1 } };
    expect(migrateSave(save, 3, example)).toBe(save);
  });

  it('meldet eine fehlende Migration', () => {
    expect(() => migrateSave({ saveVersion: 1 }, 2, {})).toThrow('Keine Migration');
  });
});
