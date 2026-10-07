import { economyConfig } from '../../config/economy';
import type { EventBus } from '../core/eventBus';
import { calendarAt } from '../core/gameTime';

/** Buchungskategorien (T1.6). Texte in ui/texts/de.ts. */
export const BOOKING_CATEGORIES = [
  'build',
  'vehicles',
  'operations',
  'rawGoods',
  'exportRevenue',
] as const;
export type BookingCategory = (typeof BOOKING_CATEGORIES)[number];

export interface Booking {
  tick: number;
  category: BookingCategory;
  /** Positiv = Einnahme, negativ = Ausgabe. */
  amountCents: number;
}

/** Summen eines Zeitraums (Tag oder Monat), je Kategorie getrennt nach Einnahmen und Ausgaben. */
export interface PeriodTotals {
  /** Tag: Tagesnummer seit Spielbeginn; Monat: Jahr · 12 + Monat. */
  key: number;
  incomeCents: Record<BookingCategory, number>;
  expenseCents: Record<BookingCategory, number>;
}

export interface Finance {
  balanceCents: number;
  /** Letzte Buchungen, neueste zuletzt (begrenzt). */
  recent: Booking[];
  today: PeriodTotals;
  month: PeriodTotals;
}

/** Ort des Geschehens für die schwebende Anzeige (Feldkoordinaten). */
export interface BookingPlace {
  x: number;
  z: number;
}

export function dayKey(tick: number): number {
  return calendarAt(tick).dayIndex;
}

export function monthKey(tick: number): number {
  const c = calendarAt(tick);
  return c.year * 12 + (c.month - 1);
}

export function emptyTotals(key: number): PeriodTotals {
  const zero = (): Record<BookingCategory, number> =>
    Object.fromEntries(BOOKING_CATEGORIES.map((c) => [c, 0])) as Record<BookingCategory, number>;
  return { key, incomeCents: zero(), expenseCents: zero() };
}

export function createFinance(balanceCents: number, tick: number): Finance {
  return {
    balanceCents,
    recent: [],
    today: emptyTotals(dayKey(tick)),
    month: emptyTotals(monthKey(tick)),
  };
}

/** Summen für „heute“ bzw. „diesen Monat“; ein veralteter Zeitraum zählt als leer. */
export function currentTotals(
  finance: Finance,
  tick: number,
  period: 'today' | 'month',
): PeriodTotals {
  const key = period === 'today' ? dayKey(tick) : monthKey(tick);
  const totals = finance[period];
  return totals.key === key ? totals : emptyTotals(key);
}

/**
 * Bucht einen Betrag: Kontostand, Tages- und Monatssummen, Liste der letzten Buchungen.
 * Meldet `finance/booked` (mit Ort für die schwebende Anzeige) und `finance/balanceChanged`.
 */
export function book(
  finance: Finance,
  tick: number,
  bus: EventBus,
  category: BookingCategory,
  amountCents: number,
  at: BookingPlace | null = null,
): void {
  if (amountCents === 0) return;
  finance.balanceCents += amountCents;
  finance.today = currentTotals(finance, tick, 'today');
  finance.month = currentTotals(finance, tick, 'month');
  for (const totals of [finance.today, finance.month]) {
    if (amountCents > 0) totals.incomeCents[category] += amountCents;
    else totals.expenseCents[category] -= amountCents;
  }
  finance.recent.push({ tick, category, amountCents });
  if (finance.recent.length > economyConfig.recentBookings) finance.recent.shift();
  bus.emit({ type: 'finance/booked', category, amountCents, at });
  bus.emit({
    type: 'finance/balanceChanged',
    balanceCents: finance.balanceCents,
    deltaCents: amountCents,
  });
}
