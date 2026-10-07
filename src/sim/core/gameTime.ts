import { timeConfig } from '../../config/time';

/** Spielzeit-Rechnung: Der Zustand speichert nur den Schrittzähler (`tick`). */

const MS_PER_DAY = 86_400_000;

/** Simulationsschritte pro Spieltag (bei 5 min/Tag und 10 Schritten/s: 3000). */
export const TICKS_PER_DAY = timeConfig.realSecondsPerGameDay * timeConfig.ticksPerRealSecond;

/** Spiel-Millisekunden pro Schritt (ganzzahlig: 28.800). */
export const GAME_MS_PER_TICK = MS_PER_DAY / TICKS_PER_DAY;

/** Echtzeit-Millisekunden pro Schritt bei 1x. */
export const REAL_MS_PER_TICK = 1000 / timeConfig.ticksPerRealSecond;

const START_MS = Date.UTC(
  timeConfig.startDate.year,
  timeConfig.startDate.month - 1,
  timeConfig.startDate.day,
);

export interface CalendarTime {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
  hour: number;
  minute: number;
  /** 0 = Sonntag … 6 = Samstag */
  weekday: number;
  /** Laufender Spieltag seit Spielbeginn, ab 0. */
  dayIndex: number;
}

/** Wandelt einen Schrittzähler in Kalenderdatum und Uhrzeit (UTC-Rechnung, keine Zeitzonen). */
export function calendarAt(tick: number): CalendarTime {
  const date = new Date(START_MS + tick * GAME_MS_PER_TICK);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    weekday: date.getUTCDay(),
    dayIndex: Math.floor(tick / TICKS_PER_DAY),
  };
}

/** True, wenn mit diesem Schritt ein neuer Spieltag beginnt. */
export function isDayStart(tick: number): boolean {
  return tick > 0 && tick % TICKS_PER_DAY === 0;
}
