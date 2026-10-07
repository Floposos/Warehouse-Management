import { describe, expect, it } from 'vitest';
import { buildConfig } from '../../config/build';
import { TICKS_PER_DAY } from '../core/gameTime';
import { Simulation } from '../core/simulation';
import { createInitialState } from '../state/gameState';
import { checkBuildRoad } from './roads';

const TILE = buildConfig.roadCostPerTileCents;
const road = (fromX: number, fromZ: number, toX: number, toZ: number, xFirst = true) =>
  ({ type: 'road/build', fromX, fromZ, toX, toZ, xFirst }) as const;

describe('Straßen bauen', () => {
  it('kostet je neuem Feld, vorhandene Felder sind kostenlos', () => {
    const s = new Simulation(createInitialState(1));
    const start = s.state.finance.balanceCents;
    expect(s.execute(road(0, 61, 9, 61))).toEqual({ ok: true });
    expect(s.state.roads).toHaveLength(10);
    expect(s.state.finance.balanceCents).toBe(start - 10 * TILE);
    // Abzweigung über vorhandene Felder: nur die 4 neuen kosten.
    expect(checkBuildRoad(s.state, { x: 5, z: 61 }, { x: 5, z: 65 }, true)).toMatchObject({
      ok: true,
      costCents: 4 * TILE,
    });
  });

  it('lehnt Gebäude, Rand und fehlendes Geld als Ganzes ab', () => {
    const state = createInitialState(1);
    expect(checkBuildRoad(state, { x: 0, z: 60 }, { x: 30, z: 60 }, true)).toMatchObject({
      ok: false,
      reason: 'occupied',
      blocked: expect.arrayContaining([{ x: 12, z: 60 }]),
    });
    expect(checkBuildRoad(state, { x: 126, z: 0 }, { x: 129, z: 0 }, true)).toMatchObject({
      reason: 'outOfBounds',
    });
    state.finance.balanceCents = TILE * 2;
    expect(checkBuildRoad(state, { x: 0, z: 0 }, { x: 2, z: 0 }, true)).toMatchObject({
      reason: 'insufficientFunds',
      costCents: 3 * TILE,
    });
  });

  it('Gebäude können nicht auf Straßen gebaut werden', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(road(40, 40, 40, 50));
    expect(s.execute({ type: 'build/place', buildingType: 'testHall', x: 36, z: 42 })).toEqual({
      ok: false,
      reason: 'occupied',
    });
  });
});

describe('Straßen abreißen', () => {
  it('erstattet je Feld nach der Tagesregel', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(road(0, 0, 3, 0));
    const before = s.state.finance.balanceCents;
    s.execute({ type: 'road/demolish', x: 1, z: 0 });
    expect(s.state.finance.balanceCents).toBe(before + TILE);
    s.run(TICKS_PER_DAY);
    s.execute({ type: 'road/demolish', x: 2, z: 0 });
    expect(s.state.finance.balanceCents).toBe(before + TILE + TILE / 2);
    expect(s.state.roads.map((r) => r.x)).toEqual([0, 3]);
  });

  it('ohne Straße wird abgelehnt', () => {
    const s = new Simulation(createInitialState(1));
    expect(s.execute({ type: 'road/demolish', x: 5, z: 5 })).toEqual({
      ok: false,
      reason: 'notFound',
    });
  });
});
