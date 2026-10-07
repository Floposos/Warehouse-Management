import { describe, expect, it } from 'vitest';
import { goodsConfig } from '../../config/goods';
import { vehicleConfig } from '../../config/vehicles';
import { TICKS_PER_DAY } from '../core/gameTime';
import type { Simulation } from '../core/simulation';
import { testWorld, zoneOf } from '../goods/testWorld';
import type { TourStop, Truck } from './types';

function buy(s: Simulation): Truck {
  s.execute({ type: 'vehicle/buyTruck' });
  const t = s.state.vehicles.at(-1);
  if (t?.kind !== 'truck') throw new Error('LKW fehlt');
  return t;
}

function exitId(s: Simulation): number {
  const exit = s.state.buildings.find((b) => b.type === 'exportExit');
  if (!exit) throw new Error('Ausfahrt fehlt');
  return exit.id;
}

describe('Feste Tour', () => {
  it('fährt die Halte der Reihe nach und beginnt dann von vorn', () => {
    const s = testWorld();
    const a = zoneOf(s, 'A');
    const b = zoneOf(s, 'B');
    a.stock.rawA = 100;
    const t = buy(s);
    const stops: TourStop[] = [
      { siteId: a.id, action: 'load', product: 'rawA' },
      { siteId: b.id, action: 'unload', product: 'rawA' },
    ];
    expect(s.execute({ type: 'vehicle/setTour', truckId: t.id, stops }).ok).toBe(true);
    expect(s.execute({ type: 'vehicle/setMode', truckId: t.id, mode: 'tour' }).ok).toBe(true);
    s.run(TICKS_PER_DAY / 3);
    // Mehrere Runden zu je voller Ladung.
    expect(b.stock.rawA).toBeGreaterThanOrEqual(2 * vehicleConfig.truckCapacity);
    expect(a.stock.rawA + (b.stock.rawA ?? 0) + (t.cargo?.quantity ?? 0)).toBe(100);
  });

  it('Tour mit Export: Endprodukt aus C wird verkauft', () => {
    const s = testWorld();
    const c = zoneOf(s, 'C');
    c.stock.final = 15;
    const t = buy(s);
    s.execute({
      type: 'vehicle/setTour',
      truckId: t.id,
      stops: [
        { siteId: c.id, action: 'load', product: 'final' },
        { siteId: exitId(s), action: 'unload', product: 'final' },
      ],
    });
    s.execute({ type: 'vehicle/setMode', truckId: t.id, mode: 'tour' });
    s.run(TICKS_PER_DAY / 4);
    expect(s.state.finance.today.incomeCents.exportRevenue).toBe(
      15 * goodsConfig.exportPriceCents.final,
    );
  });

  it('ohne Halte wartet der LKW mit Grund „keine Tour“', () => {
    const s = testWorld();
    const t = buy(s);
    s.execute({ type: 'vehicle/setMode', truckId: t.id, mode: 'tour' });
    s.run(5);
    expect(t.phase).toBe('idle');
    expect(t.idleReason).toBe('noTour');
  });

  it('lehnt unsinnige Halte ab', () => {
    const s = testWorld();
    const t = buy(s);
    const tour = (stops: TourStop[]) =>
      s.execute({ type: 'vehicle/setTour', truckId: t.id, stops });
    expect(tour([{ siteId: zoneOf(s, 'A').id, action: 'load', product: 'final' }])).toMatchObject({
      ok: false,
      reason: 'invalidStop',
    });
    expect(tour([{ siteId: exitId(s), action: 'load', product: 'final' }]).ok).toBe(false);
    expect(tour([{ siteId: exitId(s), action: 'unload', product: 'rawA' }]).ok).toBe(false);
    expect(tour([{ siteId: 999, action: 'unload', product: 'rawA' }]).ok).toBe(false);
    const many = Array.from({ length: vehicleConfig.tourMaxStops + 1 }, () => ({
      siteId: zoneOf(s, 'A').id,
      action: 'load' as const,
      product: 'rawA' as const,
    }));
    expect(tour(many)).toMatchObject({ ok: false, reason: 'tooManyStops' });
  });

  it('Umschalten auf Automatik: Ladung aus der Tour wird sinnvoll abgeliefert', () => {
    const s = testWorld();
    const a = zoneOf(s, 'A');
    a.stock.rawA = 20;
    const t = buy(s);
    s.execute({
      type: 'vehicle/setTour',
      truckId: t.id,
      stops: [{ siteId: a.id, action: 'load', product: 'rawA' }],
    });
    s.execute({ type: 'vehicle/setMode', truckId: t.id, mode: 'tour' });
    for (let i = 0; i < TICKS_PER_DAY && !t.cargo; i++) s.step();
    expect(t.cargo).toEqual({ product: 'rawA', quantity: 20 });
    s.execute({ type: 'vehicle/setMode', truckId: t.id, mode: 'auto' });
    for (let i = 0; i < TICKS_PER_DAY && t.cargo; i++) s.step();
    expect(zoneOf(s, 'B').stock.rawA).toBe(20);
  });
});
