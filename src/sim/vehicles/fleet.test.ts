import { describe, expect, it } from 'vitest';
import { leaseConfig, vehicleModelValues } from '../../config/vehicles';
import { TICKS_PER_DAY, addOneMonth } from '../core/gameTime';
import type { Simulation } from '../core/simulation';
import { testWorld, zoneOf } from '../goods/testWorld';
import { leaseMonthlyCents, modelValues, residualCents, updateLeases } from './fleet';
import type { Truck } from './types';

function buy(
  s: Simulation,
  model: 'van' | 'truck',
  drive: 'diesel' | 'electric',
  lease: boolean,
): Truck {
  const result = s.execute({ type: 'vehicle/buy', model, drive, lease });
  if (!result.ok) throw new Error(result.reason);
  const t = s.state.vehicles.find((v) => v.id === result.id);
  if (t?.kind !== 'truck') throw new Error('Fahrzeug fehlt');
  return t;
}

/** Springt die Uhr monatsweise vor und rechnet nur das Leasing (schnell statt Millionen Ticks). */
function runMonths(s: Simulation, months: number): void {
  for (let i = 0; i < months; i++) {
    s.state.tick = addOneMonth(s.state.tick);
    updateLeases(s.state, s.bus);
  }
}

describe('Fahrzeugtypen und Antrieb (T2.5)', () => {
  it('Elektro: teurer im Kauf, billiger je km; Tageskosten gleich', () => {
    const diesel = modelValues('van', 'diesel');
    const electric = modelValues('van', 'electric');
    expect(electric.priceCents).toBe(Math.round(diesel.priceCents * 1.3));
    expect(electric.costPerKmCents).toBe(Math.round(diesel.costPerKmCents / 2));
    expect(electric.dailyCents).toBe(diesel.dailyCents);
  });

  it('Transporter kauft billiger, lädt weniger und fährt schneller als der LKW', () => {
    const s = testWorld();
    const before = s.state.finance.balanceCents;
    const van = buy(s, 'van', 'diesel', false);
    expect(s.state.finance.balanceCents).toBe(before - vehicleModelValues.van.priceCents);
    zoneOf(s, 'A').stock.rawA = 60;
    for (let i = 0; i < TICKS_PER_DAY && !van.cargo; i++) s.step();
    expect(van.cargo).toEqual({ product: 'rawA', quantity: vehicleModelValues.van.capacity });
    expect(vehicleModelValues.van.speed).toBeGreaterThan(vehicleModelValues.truck.speed);
  });

  it('Tageskosten nach Typ', () => {
    const s = testWorld();
    buy(s, 'van', 'diesel', false);
    s.run(TICKS_PER_DAY - (s.state.tick % TICKS_PER_DAY));
    expect(s.state.finance.today.expenseCents.vehicles).toBe(vehicleModelValues.van.dailyCents);
  });
});

describe('Leasing mit fester Laufzeit (T2.5)', () => {
  it('erste Rate sofort, dann monatlich; nach der Laufzeit verlängert es sich mit Meldung', () => {
    const s = testWorld();
    const before = s.state.finance.balanceCents;
    const t = buy(s, 'truck', 'diesel', true);
    const rate = leaseMonthlyCents(vehicleModelValues.truck.priceCents);
    expect(rate).toBe(270_000);
    expect(s.state.finance.balanceCents).toBe(before - rate);
    const end = t.lease?.endTick ?? 0;
    const afterFirst = s.state.finance.balanceCents;
    runMonths(s, 1);
    expect(afterFirst - s.state.finance.balanceCents).toBe(rate);
    runMonths(s, leaseConfig.termMonths);
    expect(t.lease?.endTick).toBeGreaterThan(end);
    expect(s.state.notices.some((n) => n.kind === 'leaseRenewed' && n.vehicleId === t.id)).toBe(
      true,
    );
  });

  it('vorzeitige Rückgabe kostet drei Raten, kurz vor Ende nur die offene Rate', () => {
    const s = testWorld();
    const t = buy(s, 'van', 'electric', true);
    const rate = t.lease?.monthlyCents ?? 0;
    const before = s.state.finance.balanceCents;
    expect(s.execute({ type: 'vehicle/dispose', truckId: t.id }).ok).toBe(true);
    expect(s.state.finance.balanceCents).toBe(before - 3 * rate);
    expect(s.state.vehicles).toHaveLength(0);

    const late = buy(s, 'van', 'electric', true);
    runMonths(s, leaseConfig.termMonths - 2);
    const b2 = s.state.finance.balanceCents;
    s.execute({ type: 'vehicle/dispose', truckId: late.id });
    expect(b2 - s.state.finance.balanceCents).toBe(rate);
  });
});

describe('Verkaufen mit Restwert (T2.5)', () => {
  it('80 % am Anfang, je Monat 1,5 Punkte weniger, mindestens 20 %', () => {
    const s = testWorld();
    const t = buy(s, 'truck', 'diesel', false);
    expect(residualCents(s.state, t)).toBe(7_200_000);
    runMonths(s, 10);
    expect(residualCents(s.state, t)).toBe(5_850_000);
    runMonths(s, 60);
    expect(residualCents(s.state, t)).toBe(1_800_000);
    const before = s.state.finance.balanceCents;
    s.execute({ type: 'vehicle/dispose', truckId: t.id });
    expect(s.state.finance.balanceCents).toBe(before + 1_800_000);
  });
});
