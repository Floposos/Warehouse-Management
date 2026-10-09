import { describe, expect, it } from 'vitest';
import { goodsConfig } from '../../config/goods';
import { vehicleConfig } from '../../config/vehicles';
import { TICKS_PER_DAY } from '../core/gameTime';
import type { Simulation } from '../core/simulation';
import { testWorld, zoneOf } from '../goods/testWorld';
import type { Truck } from './types';

function buy(s: Simulation): Truck {
  expect(s.execute({ type: 'vehicle/buyTruck' }).ok).toBe(true);
  const t = s.state.vehicles.at(-1);
  if (t?.kind !== 'truck') throw new Error('LKW fehlt');
  return t;
}

/** Läuft, bis die Bedingung gilt (höchstens `limit` Schritte). */
function runUntil(s: Simulation, done: () => boolean, limit = TICKS_PER_DAY): void {
  for (let i = 0; i < limit && !done(); i++) s.step();
  expect(done()).toBe(true);
}

describe('LKW kaufen', () => {
  it('bucht den Kaufpreis unter „Fahrzeuge“, LKW steht an der Einfahrt', () => {
    const s = testWorld();
    const before = s.state.finance.balanceCents;
    const t = buy(s);
    expect(s.state.finance.balanceCents).toBe(before - vehicleConfig.truckPriceCents);
    expect(s.state.finance.today.expenseCents.vehicles).toBe(vehicleConfig.truckPriceCents);
    expect(t.route[0]).toEqual({ x: -1, z: 61 });
    expect(t.tourId).toBeNull();
  });

  it('ohne genug Geld wird der Kauf abgelehnt', () => {
    const s = testWorld();
    s.state.finance.balanceCents = vehicleConfig.truckPriceCents - 1;
    expect(s.execute({ type: 'vehicle/buyTruck' })).toMatchObject({
      ok: false,
      reason: 'insufficientFunds',
    });
    expect(s.state.vehicles).toEqual([]);
  });
});

describe('Automatik', () => {
  it('ohne Ware wartet der LKW mit Grund „keine Aufgabe“', () => {
    const s = testWorld();
    const t = buy(s);
    s.run(vehicleConfig.truckIdleCheckTicks * 2);
    expect(t.phase).toBe('idle');
    expect(t.idleReason).toBe('noJob');
  });

  it('bringt Rohware A von A nach B und reserviert dabei Bestand und Platz', () => {
    const s = testWorld();
    const a = zoneOf(s, 'A');
    const b = zoneOf(s, 'B');
    a.stock.rawA = 30;
    const t = buy(s);
    runUntil(s, () => t.phase === 'toPickup');
    expect(t.job).toMatchObject({ product: 'rawA', fromId: a.id, toId: b.id, quantity: 20 });
    runUntil(s, () => t.phase === 'idle' && t.job === null);
    expect(a.stock.rawA).toBe(10);
    expect(b.stock.rawA).toBe(20);
  });

  it('unter der Mindestmenge fährt er nicht los', () => {
    const s = testWorld();
    zoneOf(s, 'A').stock.rawA = vehicleConfig.truckMinLoad - 1;
    const t = buy(s);
    s.run(vehicleConfig.truckIdleCheckTicks * 3);
    expect(t.phase).toBe('idle');
  });

  it('Endprodukt aus C hat Vorrang und wird an der Ausfahrt verkauft', () => {
    const s = testWorld();
    zoneOf(s, 'A').stock.rawA = 30;
    zoneOf(s, 'C').stock.final = 10;
    const t = buy(s);
    const before = s.state.finance.balanceCents;
    runUntil(s, () => t.phase === 'toPickup');
    expect(t.job?.product).toBe('final');
    runUntil(s, () => s.state.finance.today.incomeCents.exportRevenue > 0);
    expect(s.state.finance.balanceCents).toBeGreaterThan(before);
    expect(s.state.finance.today.incomeCents.exportRevenue).toBe(
      10 * goodsConfig.exportPriceCents.final,
    );
  });

  it('Kombi geht nach C; ist C voll, direkt in den Export', () => {
    const s = testWorld();
    const c = zoneOf(s, 'C');
    zoneOf(s, 'B').stock.combo = 10;
    const t = buy(s);
    runUntil(s, () => t.phase === 'toPickup');
    expect(t.job?.toId).toBe(c.id);

    const s2 = testWorld();
    const c2 = zoneOf(s2, 'C');
    c2.stock.combo = 90;
    zoneOf(s2, 'B').stock.combo = 10;
    const t2 = buy(s2);
    runUntil(s2, () => t2.phase === 'toPickup');
    expect(t2.job?.toId).toBe(s2.state.buildings.find((b) => b.type === 'exportExit')?.id);
  });

  it('wird das Ziel abgerissen, sucht er mit der Ladung ein neues', () => {
    const s = testWorld();
    zoneOf(s, 'B').stock.combo = 10;
    const t = buy(s);
    runUntil(s, () => t.phase === 'toDropoff');
    s.execute({ type: 'zone/demolish', zoneId: zoneOf(s, 'C').id });
    runUntil(s, () => s.state.finance.today.incomeCents.exportRevenue > 0);
    expect(t.cargo).toBeNull();
  });

  it('ohne Straße zur Quelle meldet er „kein Weg“', () => {
    const s = testWorld();
    zoneOf(s, 'A').stock.rawA = 20;
    s.execute({ type: 'road/demolish', x: 5, z: 61 });
    const t = buy(s);
    s.run(vehicleConfig.truckIdleCheckTicks * 2);
    expect(t.idleReason).toBe('noRoute');
  });
});

describe('Kosten und ganze Kette', () => {
  it('Tageswechsel bucht Tageskosten und gefahrene Kilometer', () => {
    const s = testWorld();
    zoneOf(s, 'A').stock.rawA = 20;
    const t = buy(s);
    runUntil(s, () => t.job === null && zoneOf(s, 'B').stock.rawA === 20);
    const before = s.state.finance.balanceCents;
    runUntil(s, () => s.state.finance.balanceCents !== before);
    const cost = before - s.state.finance.balanceCents;
    expect(cost).toBeGreaterThan(vehicleConfig.truckDailyCents);
    expect(cost).toBeLessThan(vehicleConfig.truckDailyCents + 200);
  });

  it('Kilometerzähler bleibt ganzzahlig (Spielstand), Rest wird übertragen', () => {
    const s = testWorld();
    const t = buy(s);
    t.odometer = 1_234_567;
    s.run(TICKS_PER_DAY);
    expect(Number.isInteger(t.odometer)).toBe(true);
    const rate = vehicleConfig.metersPerField * vehicleConfig.truckCostPerKmCents;
    expect(t.odometer * rate).toBeLessThan(1_000_000);
  });

  it('Rohware → A → B → C → Export: Kasse wächst über zwei Tage', () => {
    const s = testWorld();
    s.execute({ type: 'order/create', product: 'rawA', quantity: 50, interval: 'daily' });
    s.execute({ type: 'order/create', product: 'rawB', quantity: 20, interval: 'daily' });
    buy(s);
    buy(s);
    const start = s.state.finance.balanceCents;
    s.run(TICKS_PER_DAY * 3);
    expect(s.state.finance.month.incomeCents.exportRevenue).toBeGreaterThan(0);
    expect(s.state.finance.balanceCents).toBeGreaterThan(start);
  });
});
