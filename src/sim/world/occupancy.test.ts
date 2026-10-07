import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state/gameState';
import { GRID_WIDTH, isInsideCampus } from './grid';
import { buildOccupancy, occupantAt } from './occupancy';

describe('Belegung', () => {
  it('trägt die Testhalle auf allen ihren Feldern ein', () => {
    const state = createInitialState(1);
    const hall = state.buildings[0] ?? fail();
    expect(occupantAt(state, hall.x, hall.z)).toBe(hall.id);
    expect(occupantAt(state, hall.x + 7, hall.z + 5)).toBe(hall.id);
    expect(occupantAt(state, hall.x + 8, hall.z)).toBe(0);
    expect(buildOccupancy(state).filter((c) => c === hall.id)).toHaveLength(48);
  });

  it('außerhalb des Geländes ist nichts belegt', () => {
    expect(occupantAt(createInitialState(1), -1, 0)).toBe(0);
  });

  it('erkennt Flächen außerhalb des Geländes', () => {
    expect(isInsideCampus({ x: 0, z: 0, width: 8, depth: 6 })).toBe(true);
    expect(isInsideCampus({ x: GRID_WIDTH - 7, z: 0, width: 8, depth: 6 })).toBe(false);
    expect(isInsideCampus({ x: -1, z: 0, width: 8, depth: 6 })).toBe(false);
    expect(isInsideCampus({ x: 0.5, z: 0, width: 8, depth: 6 })).toBe(false);
  });
});

function fail(): never {
  throw new Error('Gebäude fehlt');
}
