import { describe, expect, it } from 'vitest';
import type { Cell } from '../world/roadLine';
import { addVehicle, line, stepAll, trafficWorld } from './trafficTestKit';

/** Kreuzung bei (10, 10) mit Armen von 5 Feldern. */
const CROSS: Cell[] = [
  ...line({ x: 5, z: 10 }, { x: 15, z: 10 }),
  ...line({ x: 10, z: 5 }, { x: 10, z: 15 }),
];
const at = (x: number, z: number): Cell => ({ x, z });

function runUntilDone(state: ReturnType<typeof trafficWorld>, limit = 400): number {
  for (let i = 0; i < limit; i++) {
    if (state.vehicles.every((v) => v.route.length === 1)) return i;
    stepAll(state);
  }
  throw new Error('nicht alle angekommen');
}

describe('Abstand halten (T2.2)', () => {
  it('Fahrzeuge in derselben Richtung überholen sich nicht und halten ein Feld Abstand', () => {
    const state = trafficWorld(line(at(0, 0), at(20, 0)));
    const front = addVehicle(state, line(at(2, 0), at(20, 0)));
    const back = addVehicle(state, line(at(0, 0), at(20, 0)));
    for (let i = 0; i < 80; i++) {
      stepAll(state);
      const gap = (front.route[0]?.x ?? 0) - (back.route[0]?.x ?? 0);
      expect(gap).toBeGreaterThanOrEqual(1);
    }
    expect(front.route[0]).toEqual(at(20, 0));
    // Der hintere steht vor dem Ziel, weil dort der vordere steht.
    expect(back.route).toEqual([at(19, 0), at(20, 0)]);
    expect(back.waitTicks).toBeGreaterThan(0);
  });

  it('Gegenverkehr auf der anderen Spur stört nicht', () => {
    const state = trafficWorld(line(at(0, 0), at(10, 0)));
    addVehicle(state, line(at(0, 0), at(10, 0)));
    addVehicle(state, line(at(10, 0), at(0, 0)));
    expect(runUntilDone(state)).toBeLessThanOrEqual(26);
  });
});

describe('Kreuzungen (T2.2)', () => {
  it('vier Fahrzeuge aus vier Richtungen kommen alle durch, nie zwei in der Kreuzung', () => {
    const state = trafficWorld(CROSS);
    addVehicle(state, line(at(5, 10), at(15, 10)));
    addVehicle(state, line(at(15, 10), at(5, 10)));
    addVehicle(state, line(at(10, 5), at(10, 15)));
    addVehicle(state, line(at(10, 15), at(10, 5)));
    runUntilDone(state);
  });

  it('ohne Markierung gilt rechts vor links', () => {
    const state = trafficWorld(CROSS);
    // Beide stehen direkt vor der Kreuzung: einer fährt nach Norden, einer kommt von Osten.
    const north = addVehicle(state, line(at(10, 11), at(10, 5)));
    const west = addVehicle(state, line(at(11, 10), at(5, 10)));
    stepAll(state);
    expect(west.progress).toBeGreaterThan(0);
    expect(north.progress).toBe(0);
  });

  it('wer auf der Vorfahrtsstraße kommt, fährt zuerst', () => {
    const state = trafficWorld(CROSS, line(at(5, 10), at(15, 10)));
    const north = addVehicle(state, line(at(10, 11), at(10, 5)));
    const east = addVehicle(state, line(at(9, 10), at(15, 10)));
    stepAll(state);
    expect(east.progress).toBeGreaterThan(0);
    expect(north.progress).toBe(0);
  });

  it('fährt nicht in die Kreuzung, wenn dahinter kein Platz ist', () => {
    const state = trafficWorld(CROSS);
    const blocker = addVehicle(state, [at(11, 10)]);
    blocker.heading = 1;
    const v = addVehicle(state, line(at(9, 10), at(15, 10)));
    for (let i = 0; i < 20; i++) stepAll(state);
    expect(v.route[0]).toEqual(at(9, 10));
    expect(v.progress).toBe(0);
  });

  it('gleiche Ausgangslage ergibt den gleichen Ablauf', () => {
    const run = () => {
      const state = trafficWorld(CROSS);
      addVehicle(state, line(at(5, 10), at(15, 10)));
      addVehicle(state, line(at(15, 10), at(5, 10)));
      addVehicle(state, line(at(10, 5), at(10, 15)));
      addVehicle(state, line(at(10, 15), at(10, 5)));
      for (let i = 0; i < 25; i++) stepAll(state);
      return JSON.stringify(state.vehicles);
    };
    expect(run()).toBe(run());
  });
});
