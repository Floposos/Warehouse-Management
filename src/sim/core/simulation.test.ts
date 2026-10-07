import { describe, expect, it } from 'vitest';
import { createInitialState, type GameState } from '../state/gameState';
import { defaultSystems } from '../systems';
import type { SimSystem } from '../systems/types';
import { TICKS_PER_DAY } from './gameTime';
import { nextInt } from './rng';
import { Simulation } from './simulation';
import { StepClock } from './stepClock';

/** Test-System, das in jedem Schritt Zufall verbraucht und den Kontostand verändert. */
const noiseSystem: SimSystem = {
  id: 'noise',
  update(state) {
    state.finance.balanceCents += nextInt(state.rng, -100, 100);
  },
};
const systems = [...defaultSystems, noiseSystem];

function play(seed: number, ticks: number): GameState {
  const sim = new Simulation(createInitialState(seed), systems);
  for (let i = 0; i < ticks; i++) {
    if (i % 1000 === 0) sim.submit({ type: 'finance/adjustBalance', deltaCents: i });
    sim.step();
  }
  return sim.state;
}

describe('Simulation', () => {
  it('gleicher Seed und gleiche Befehle ergeben nach 10.000 Schritten denselben Zustand', () => {
    expect(play(1234, 10_000)).toEqual(play(1234, 10_000));
    expect(play(1234, 10_000)).not.toEqual(play(4321, 10_000));
  });

  it('4x für 1 Sekunde ergibt denselben Zustand wie 1x für 4 Sekunden; Pause ändert nichts', () => {
    const run = (speed: number, frames: number): GameState => {
      const sim = new Simulation(createInitialState(5), systems);
      const clock = new StepClock();
      for (let f = 0; f < frames; f++) sim.run(clock.advance(1000 / 60, speed));
      for (let f = 0; f < 120; f++) sim.run(clock.advance(1000 / 60, 0));
      return sim.state;
    };
    const fast = run(4, 60);
    expect(fast.tick).toBe(40);
    expect(fast).toEqual(run(1, 240));
  });

  it('meldet Tages-, Monats- und Jahreswechsel', () => {
    const sim = new Simulation(createInitialState(1));
    const seen: string[] = [];
    sim.bus.onAny((e) => {
      if (e.type === 'time/dayStarted') seen.push(`Tag ${e.day}.${e.month}.${e.year}`);
      if (e.type === 'time/monthStarted') seen.push(`Monat ${e.month}.${e.year}`);
      if (e.type === 'time/yearStarted') seen.push(`Jahr ${e.year}`);
    });
    sim.run(TICKS_PER_DAY);
    expect(seen).toEqual(['Tag 2.1.2000']);
    sim.run(TICKS_PER_DAY * 30);
    expect(seen.slice(-2)).toEqual(['Monat 2.2000', 'Tag 1.2.2000']);
    sim.run(TICKS_PER_DAY * (366 - 31));
    expect(seen.slice(-3)).toEqual(['Jahr 2001', 'Monat 1.2001', 'Tag 1.1.2001']);
  });

  it('übersteht eine JSON-Rundreise ohne Änderung und rechnet gleich weiter', () => {
    const sim = new Simulation(createInitialState(77), systems);
    sim.run(500);
    const copy = JSON.parse(JSON.stringify(sim.state)) as GameState;
    expect(copy).toEqual(sim.state);
    const resumed = new Simulation(copy, systems);
    sim.run(500);
    resumed.run(500);
    expect(resumed.state).toEqual(sim.state);
  });

  it('führt Befehle im nächsten Schritt aus und lehnt ungültige ab', () => {
    const sim = new Simulation(createInitialState(1));
    const start = sim.state.finance.balanceCents;
    const rejected: string[] = [];
    sim.bus.on('command/rejected', (e) => rejected.push(e.reason));
    sim.submit({ type: 'finance/adjustBalance', deltaCents: 500 });
    expect(sim.state.finance.balanceCents).toBe(start);
    sim.step();
    expect(sim.state.finance.balanceCents).toBe(start + 500);
    sim.submit({ type: 'finance/adjustBalance', deltaCents: 0.5 });
    sim.step();
    expect(sim.state.finance.balanceCents).toBe(start + 500);
    expect(rejected).toHaveLength(1);
  });

  it('hat einen Kontostand als Platzhalter', () => {
    expect(createInitialState(1).finance.balanceCents).toBeGreaterThan(0);
  });
});
