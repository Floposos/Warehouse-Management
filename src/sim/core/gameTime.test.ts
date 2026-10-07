import { describe, expect, it } from 'vitest';
import { GAME_MS_PER_TICK, TICKS_PER_DAY, calendarAt, isDayStart } from './gameTime';

describe('gameTime', () => {
  it('ein Spieltag dauert 5 Minuten Echtzeit bei 1x (3000 Schritte à 100 ms)', () => {
    expect(TICKS_PER_DAY).toBe(3000);
    expect(Number.isInteger(GAME_MS_PER_TICK)).toBe(true);
  });

  it('startet am 1. Januar 2000 um 00:00 (Samstag)', () => {
    expect(calendarAt(0)).toEqual({
      year: 2000,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      weekday: 6,
      dayIndex: 0,
    });
  });

  it('rechnet Uhrzeit und Tageswechsel', () => {
    expect(calendarAt(TICKS_PER_DAY / 2)).toMatchObject({ day: 1, hour: 12, minute: 0 });
    expect(calendarAt(TICKS_PER_DAY)).toMatchObject({ day: 2, hour: 0, dayIndex: 1 });
    expect(isDayStart(0)).toBe(false);
    expect(isDayStart(TICKS_PER_DAY)).toBe(true);
    expect(isDayStart(TICKS_PER_DAY + 1)).toBe(false);
  });

  it('kennt Schaltjahr 2000 (29. Februar)', () => {
    expect(calendarAt(TICKS_PER_DAY * 59)).toMatchObject({ month: 2, day: 29 });
    expect(calendarAt(TICKS_PER_DAY * 366)).toMatchObject({ year: 2001, month: 1, day: 1 });
  });
});
