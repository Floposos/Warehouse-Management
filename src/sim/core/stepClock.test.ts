import { describe, expect, it } from 'vitest';
import { StepClock } from './stepClock';

describe('StepClock', () => {
  it('erzeugt 10 Schritte pro Echtzeit-Sekunde bei 1x', () => {
    const clock = new StepClock();
    let ticks = 0;
    for (let i = 0; i < 60; i++) ticks += clock.advance(1000 / 60, 1);
    expect(ticks).toBe(10);
  });

  it('4x für 1 Sekunde ergibt so viele Schritte wie 1x für 4 Sekunden', () => {
    const fast = new StepClock();
    const slow = new StepClock();
    let a = 0;
    let b = 0;
    for (let i = 0; i < 60; i++) a += fast.advance(1000 / 60, 4);
    for (let i = 0; i < 240; i++) b += slow.advance(1000 / 60, 1);
    expect(a).toBe(40);
    expect(b).toBe(40);
  });

  it('macht bei Pause keine Schritte', () => {
    const clock = new StepClock();
    expect(clock.advance(5000, 0)).toBe(0);
    expect(clock.alpha).toBe(0);
  });

  it('begrenzt die Schritte nach einem langen Ruckler', () => {
    const clock = new StepClock(40);
    expect(clock.advance(60_000, 4)).toBe(40);
    expect(clock.advance(1, 1)).toBe(0);
  });
});
