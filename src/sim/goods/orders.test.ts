import { describe, expect, it } from 'vitest';
import { goodsConfig } from '../../config/goods';
import { vehicleConfig } from '../../config/vehicles';
import { TICKS_PER_DAY } from '../core/gameTime';
import { Simulation } from '../core/simulation';
import type { OrderInterval } from './orders';
import { testWorld, zoneOf } from './testWorld';

const order = (product: 'rawA' | 'rawB', quantity: number, interval: OrderInterval = 'once') =>
  ({ type: 'order/create', product, quantity, interval }) as const;

/** Läuft, bis keine Zulieferer mehr unterwegs sind (höchstens einen Spieltag). */
function runUntilIdle(s: Simulation): void {
  for (let i = 0; i < TICKS_PER_DAY && (i === 0 || s.state.vehicles.length > 0); i++) s.step();
}

describe('Rohware bestellen und liefern', () => {
  it('bezahlt beim Losschicken, Zulieferer fährt hin, lädt ab und verlässt das Gelände', () => {
    const s = testWorld();
    const before = s.state.finance.balanceCents;
    s.execute(order('rawA', 20));
    s.step();
    expect(s.state.vehicles).toHaveLength(1);
    expect(s.state.finance.balanceCents).toBe(before - 20 * goodsConfig.purchasePriceCents.rawA);
    expect(s.state.finance.today.expenseCents.rawGoods).toBe(
      20 * goodsConfig.purchasePriceCents.rawA,
    );
    runUntilIdle(s);
    expect(zoneOf(s, 'A').stock.rawA).toBe(20);
    expect(s.state.vehicles).toEqual([]);
    expect(s.state.orders).toEqual([]);
  });

  it('Rohware B geht nach B; Dauerauftrag liefert am nächsten Tag erneut', () => {
    const s = testWorld();
    s.execute(order('rawB', 5, 'daily'));
    runUntilIdle(s);
    expect(zoneOf(s, 'B').stock.rawB).toBe(5);
    s.run(TICKS_PER_DAY);
    runUntilIdle(s);
    expect(zoneOf(s, 'B').stock.rawB).toBe(10);
    expect(s.state.orders).toHaveLength(1);
  });

  it('volle Lager stoppen den Zufluss: Teillieferung, dann „voll“', () => {
    const s = testWorld();
    const capacity = 9 * 10;
    s.execute(order('rawA', 100, 'daily'));
    runUntilIdle(s);
    expect(zoneOf(s, 'A').stock.rawA).toBe(capacity);
    s.run(TICKS_PER_DAY);
    expect(s.state.orders[0]?.blocked).toBe('full');
    expect(s.state.vehicles).toEqual([]);
  });

  it('meldet fehlenden Lieferort, fehlenden Weg und fehlendes Geld', () => {
    const s = testWorld();
    s.execute({ type: 'zone/demolish', zoneId: zoneOf(s, 'A').id });
    s.execute(order('rawA', 5));
    s.step();
    expect(s.state.orders[0]?.blocked).toBe('noSite');

    const t = testWorld();
    t.execute({ type: 'road/demolish', x: 0, z: 61 });
    t.execute(order('rawB', 5));
    t.step();
    expect(t.state.orders[0]?.blocked).toBe('noRoute');
    t.execute({ type: 'road/build', fromX: 0, fromZ: 61, toX: 1, toZ: 61, xFirst: true });
    t.run(vehicleConfig.retryTicks);
    expect(t.state.orders).toEqual([]);
    expect(t.state.vehicles).toHaveLength(1);

    const u = testWorld();
    u.execute({ type: 'finance/adjustBalance', deltaCents: -u.state.finance.balanceCents });
    u.execute(order('rawA', 5));
    u.step();
    expect(u.state.orders[0]?.blocked).toBe('noMoney');
  });
});

describe('Zulieferer unterwegs', () => {
  it('Lieferort abgerissen: Erstattung und Umkehr', () => {
    const s = testWorld();
    s.execute(order('rawA', 10));
    s.run(5);
    const balance = s.state.finance.balanceCents;
    const zone = zoneOf(s, 'A');
    s.execute({ type: 'zone/demolish', zoneId: zone.id });
    const refund = s.state.finance.balanceCents - balance;
    s.step();
    expect(s.state.finance.balanceCents - balance - refund).toBe(
      10 * goodsConfig.purchasePriceCents.rawA,
    );
    runUntilIdle(s);
    expect(s.state.vehicles).toEqual([]);
  });

  it('Straße vor ihm abgerissen: wartet, fährt weiter, sobald sie wieder da ist', () => {
    const s = testWorld();
    s.execute(order('rawB', 10));
    s.run(40);
    s.execute({ type: 'road/demolish', x: 15, z: 61 });
    s.run(200);
    expect(s.state.vehicles[0]?.phase).toBe('noRoute');
    s.execute({ type: 'road/build', fromX: 14, fromZ: 61, toX: 16, toZ: 61, xFirst: true });
    runUntilIdle(s);
    expect(zoneOf(s, 'B').stock.rawB).toBe(10);
  });

  it('Speichern mitten in der Fahrt setzt exakt fort', () => {
    const a = testWorld();
    a.execute(order('rawA', 10, 'daily'));
    a.run(37);
    const b = new Simulation(JSON.parse(JSON.stringify(a.state)));
    a.run(TICKS_PER_DAY + 500);
    b.run(TICKS_PER_DAY + 500);
    expect(b.state).toEqual(a.state);
  });
});
