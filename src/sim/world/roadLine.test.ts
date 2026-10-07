import { describe, expect, it } from 'vitest';
import { prefersXFirst, roadLine } from './roadLine';

describe('Straße ziehen', () => {
  it('gerade Linie enthält Start und Ziel', () => {
    expect(roadLine({ x: 2, z: 5 }, { x: 5, z: 5 }, true)).toEqual([
      { x: 2, z: 5 },
      { x: 3, z: 5 },
      { x: 4, z: 5 },
      { x: 5, z: 5 },
    ]);
  });

  it('L-Form mit Knick je nach Richtung, ohne doppeltes Eckfeld', () => {
    const xFirst = roadLine({ x: 0, z: 0 }, { x: 2, z: 2 }, true);
    expect(xFirst).toEqual([
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 2, z: 0 },
      { x: 2, z: 1 },
      { x: 2, z: 2 },
    ]);
    const zFirst = roadLine({ x: 0, z: 0 }, { x: -1, z: -2 }, false);
    expect(zFirst).toEqual([
      { x: 0, z: 0 },
      { x: 0, z: -1 },
      { x: 0, z: -2 },
      { x: -1, z: -2 },
    ]);
  });

  it('ein einzelnes Feld', () => {
    expect(roadLine({ x: 3, z: 3 }, { x: 3, z: 3 }, true)).toEqual([{ x: 3, z: 3 }]);
  });

  it('Knick zuerst entlang der längeren Richtung', () => {
    expect(prefersXFirst({ x: 0, z: 0 }, { x: 5, z: 2 })).toBe(true);
    expect(prefersXFirst({ x: 0, z: 0 }, { x: 1, z: -4 })).toBe(false);
  });
});
