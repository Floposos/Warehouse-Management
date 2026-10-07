import { describe, expect, it } from 'vitest';
import { buildConfig } from '../../config/build';
import { TICKS_PER_DAY } from '../core/gameTime';
import { Simulation } from '../core/simulation';
import { createInitialState } from '../state/gameState';
import { checkPlaceBuilding } from './build';

const COST = buildConfig.buildingCostCents.testHall;

function sim(): Simulation {
  return new Simulation(createInitialState(7));
}

describe('Bauen', () => {
  it('baut auf freier Fläche und bucht die Kosten ab', () => {
    const s = sim();
    const before = s.state.finance.balanceCents;
    s.submit({ type: 'build/place', buildingType: 'testHall', x: 40, z: 40 });
    s.step();
    expect(s.state.buildings).toHaveLength(2);
    expect(s.state.buildings[1]).toMatchObject({ x: 40, z: 40, paidCents: COST, builtTick: 0 });
    expect(s.state.finance.balanceCents).toBe(before - COST);
  });

  it('lehnt belegte Felder, Rand und fehlendes Geld ab', () => {
    const state = createInitialState(7);
    const hall = state.buildings[0] ?? fail();
    expect(checkPlaceBuilding(state, 'testHall', hall.x + 3, hall.z + 2)).toMatchObject({
      ok: false,
      reason: 'occupied',
    });
    expect(checkPlaceBuilding(state, 'testHall', 125, 0)).toMatchObject({ reason: 'outOfBounds' });
    state.finance.balanceCents = COST - 1;
    expect(checkPlaceBuilding(state, 'testHall', 40, 40)).toMatchObject({
      reason: 'insufficientFunds',
    });
  });

  it('ein abgelehnter Befehl ändert nichts und meldet den Grund', () => {
    const s = sim();
    const before = JSON.stringify(s.state);
    const reasons: string[] = [];
    s.bus.on('command/rejected', (e) => reasons.push(e.reason));
    s.submit({ type: 'build/place', buildingType: 'testHall', x: 12, z: 58 });
    s.step();
    expect(reasons).toEqual(['occupied']);
    expect(s.state.buildings).toHaveLength(1);
    expect({ ...JSON.parse(before), tick: 1 }).toEqual(JSON.parse(JSON.stringify(s.state)));
  });
});

describe('Abreißen', () => {
  function builtSim(): { s: Simulation; id: number } {
    const s = sim();
    s.submit({ type: 'build/place', buildingType: 'testHall', x: 40, z: 40 });
    s.step();
    return { s, id: (s.state.buildings[1] ?? fail()).id };
  }

  it('erstattet am selben Spieltag 100 %', () => {
    const { s, id } = builtSim();
    const before = s.state.finance.balanceCents;
    s.submit({ type: 'build/demolish', buildingId: id });
    s.step();
    expect(s.state.buildings).toHaveLength(1);
    expect(s.state.finance.balanceCents).toBe(before + COST);
  });

  it('erstattet ab dem nächsten Spieltag 50 %', () => {
    const { s, id } = builtSim();
    s.run(TICKS_PER_DAY);
    const before = s.state.finance.balanceCents;
    s.submit({ type: 'build/demolish', buildingId: id });
    s.step();
    expect(s.state.finance.balanceCents).toBe(before + COST / 2);
  });

  it('die kostenlose Start-Testhalle bringt nichts zurück', () => {
    const s = sim();
    const before = s.state.finance.balanceCents;
    s.submit({ type: 'build/demolish', buildingId: 1 });
    s.step();
    expect(s.state.buildings).toHaveLength(0);
    expect(s.state.finance.balanceCents).toBe(before);
  });

  it('unbekannte Gebäude werden abgelehnt', () => {
    const s = sim();
    const reasons: string[] = [];
    s.bus.on('command/rejected', (e) => reasons.push(e.reason));
    s.submit({ type: 'build/demolish', buildingId: 99 });
    s.step();
    expect(reasons).toEqual(['notFound']);
  });

  it('freigewordene Fläche kann wieder bebaut werden', () => {
    const { s, id } = builtSim();
    s.submit({ type: 'build/demolish', buildingId: id });
    s.submit({ type: 'build/place', buildingType: 'testHall', x: 40, z: 40 });
    s.step();
    expect(s.state.buildings.map((b) => b.x)).toEqual([12, 40]);
  });
});

function fail(): never {
  throw new Error('Gebäude fehlt');
}

describe('Sofort ausführen', () => {
  it('baut auch ohne Schritt (Pause) und liefert das Ergebnis', () => {
    const s = sim();
    const placed: number[] = [];
    s.bus.on('build/placed', (e) => placed.push(e.id));
    expect(s.execute({ type: 'build/place', buildingType: 'testHall', x: 40, z: 40 })).toEqual({
      ok: true,
    });
    expect(s.state.tick).toBe(0);
    expect(placed).toEqual([2]);
    expect(s.execute({ type: 'build/place', buildingType: 'testHall', x: 40, z: 40 })).toEqual({
      ok: false,
      reason: 'occupied',
    });
  });

  it('ergibt denselben Zustand wie submit vor dem nächsten Schritt', () => {
    const a = sim();
    const b = sim();
    a.run(5);
    b.run(5);
    a.execute({ type: 'build/place', buildingType: 'testHall', x: 40, z: 40 });
    a.step();
    b.submit({ type: 'build/place', buildingType: 'testHall', x: 40, z: 40 });
    b.step();
    expect(a.state).toEqual(b.state);
  });
});
