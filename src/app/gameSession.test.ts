import { describe, expect, it } from 'vitest';
import { createInitialState } from '../sim/state/gameState';
import { GameSession } from './gameSession';

describe('GameSession', () => {
  it('startet mit 1x und rechnet 10 Schritte pro Sekunde', () => {
    const session = new GameSession(createInitialState(1));
    expect(session.speed).toBe(1);
    session.frame(1000);
    expect(session.state.tick).toBe(10);
  });

  it('Pause hält die Zeit an, Weiter setzt mit der vorherigen Stufe fort', () => {
    const session = new GameSession(createInitialState(1));
    session.setSpeed(4);
    session.togglePause();
    session.frame(1000);
    expect(session.state.tick).toBe(0);
    session.togglePause();
    expect(session.speed).toBe(4);
    session.frame(1000);
    expect(session.state.tick).toBe(40);
  });

  it('meldet Geschwindigkeitswechsel', () => {
    const session = new GameSession(createInitialState(1));
    const seen: number[] = [];
    session.onSpeedChange((s) => seen.push(s));
    session.setSpeed(2);
    session.setSpeed(2);
    session.pause();
    expect(seen).toEqual([2, 0]);
  });
});
