import { describe, expect, it } from 'vitest';
import { economyConfig } from '../../config/economy';
import { EventBus } from '../core/eventBus';
import { TICKS_PER_DAY } from '../core/gameTime';
import type { SimEvent } from '../core/events';
import { book, createFinance, currentTotals } from './ledger';

function setup(): { bus: EventBus; events: SimEvent[] } {
  const bus = new EventBus();
  const events: SimEvent[] = [];
  bus.onAny((e) => events.push(e));
  return { bus, events };
}

describe('Kasse', () => {
  it('bucht Einnahmen und Ausgaben je Kategorie und meldet sie mit Ort', () => {
    const { bus, events } = setup();
    const f = createFinance(1_000, 0);
    book(f, 5, bus, 'build', -300, { x: 4, z: 7 });
    book(f, 6, bus, 'exportRevenue', 500);
    book(f, 7, bus, 'build', 100);
    bus.flush();
    expect(f.balanceCents).toBe(1_300);
    expect(f.today.expenseCents.build).toBe(300);
    expect(f.today.incomeCents.build).toBe(100);
    expect(f.month.incomeCents.exportRevenue).toBe(500);
    expect(f.recent.map((b) => b.amountCents)).toEqual([-300, 500, 100]);
    expect(events[0]).toEqual({
      type: 'finance/booked',
      category: 'build',
      amountCents: -300,
      at: { x: 4, z: 7 },
    });
    expect(events[1]).toEqual({
      type: 'finance/balanceChanged',
      balanceCents: 700,
      deltaCents: -300,
    });
  });

  it('beginnt jeden Tag und jeden Monat bei null', () => {
    const { bus } = setup();
    const f = createFinance(0, 0);
    book(f, 10, bus, 'rawGoods', -100);
    const nextDay = TICKS_PER_DAY + 1;
    expect(currentTotals(f, nextDay, 'today').expenseCents.rawGoods).toBe(0);
    expect(currentTotals(f, nextDay, 'month').expenseCents.rawGoods).toBe(100);
    book(f, nextDay, bus, 'rawGoods', -50);
    expect(f.today.expenseCents.rawGoods).toBe(50);
    expect(f.month.expenseCents.rawGoods).toBe(150);
    const nextMonth = TICKS_PER_DAY * 31;
    expect(currentTotals(f, nextMonth, 'month').expenseCents.rawGoods).toBe(0);
  });

  it('merkt sich nur die letzten Buchungen', () => {
    const { bus } = setup();
    const f = createFinance(0, 0);
    for (let i = 1; i <= economyConfig.recentBookings + 5; i++) book(f, i, bus, 'operations', -i);
    expect(f.recent).toHaveLength(economyConfig.recentBookings);
    expect(f.recent.at(-1)?.amountCents).toBe(-(economyConfig.recentBookings + 5));
  });

  it('Null-Beträge werden nicht gebucht', () => {
    const { bus } = setup();
    const f = createFinance(0, 0);
    book(f, 1, bus, 'build', 0);
    expect(f.recent).toEqual([]);
  });
});
