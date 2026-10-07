import { describe, expect, it } from 'vitest';
import { TICKS_PER_DAY, calendarAt } from '../../sim/core/gameTime';
import { formatClock } from './clockLabel';

describe('formatClock', () => {
  it('zeigt Wochentag, Datum und Uhrzeit', () => {
    expect(formatClock(calendarAt(0))).toBe('Sa, 01.01.2000 · 00:00');
    expect(formatClock(calendarAt(TICKS_PER_DAY * 2 + TICKS_PER_DAY / 4))).toBe(
      'Mo, 03.01.2000 · 06:00',
    );
  });
});
