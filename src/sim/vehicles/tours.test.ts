import { describe, expect, it } from 'vitest';
import { vehicleConfig } from '../../config/vehicles';
import { tourColors } from '../../content/tourColors';
import { TICKS_PER_DAY } from '../core/gameTime';
import type { Simulation } from '../core/simulation';
import { giveTour, testWorld, zoneOf } from '../goods/testWorld';
import type { TourStop, Truck } from './types';

function buy(s: Simulation): Truck {
  s.execute({ type: 'vehicle/buyTruck' });
  const t = s.state.vehicles.at(-1);
  if (t?.kind !== 'truck') throw new Error('LKW fehlt');
  return t;
}

function aToB(s: Simulation): TourStop[] {
  return [
    { siteId: zoneOf(s, 'A').id, action: 'load', product: 'rawA' },
    { siteId: zoneOf(s, 'B').id, action: 'unload', product: 'rawA' },
  ];
}

describe('Touren als eigene Einträge (T2.1)', () => {
  it('legt Touren an und vergibt die am wenigsten benutzte Farbe', () => {
    const s = testWorld();
    const first = s.execute({ type: 'tour/create', name: '  Früh  ' });
    const second = s.execute({ type: 'tour/create', name: 'Spät' });
    expect(first.ok && second.ok).toBe(true);
    expect(s.state.tours.map((t) => [t.name, t.color])).toEqual([
      ['Früh', 0],
      ['Spät', 1],
    ]);
    expect(s.execute({ type: 'tour/create', name: 'Rot', color: 0 }).ok).toBe(true);
    expect(s.state.tours.at(-1)?.color).toBe(0);
  });

  it('lehnt leere Namen und unbekannte Farben ab', () => {
    const s = testWorld();
    expect(s.execute({ type: 'tour/create', name: '   ' })).toMatchObject({
      ok: false,
      reason: 'invalidName',
    });
    const long = 'x'.repeat(vehicleConfig.tourNameMaxLength + 1);
    expect(s.execute({ type: 'tour/create', name: long }).ok).toBe(false);
    expect(s.execute({ type: 'tour/create', name: 'A', color: tourColors.length })).toMatchObject({
      ok: false,
      reason: 'invalidColor',
    });
    expect(s.state.tours).toHaveLength(0);
  });

  it('mehrere LKW fahren dieselbe Tour', () => {
    const s = testWorld();
    zoneOf(s, 'A').stock.rawA = 100;
    const [t1, t2] = [buy(s), buy(s)];
    const tourId = giveTour(s, t1.id, aToB(s));
    expect(s.execute({ type: 'vehicle/assignTour', truckId: t2.id, tourId }).ok).toBe(true);
    s.run(TICKS_PER_DAY / 3);
    expect(t1.tourId).toBe(tourId);
    expect(t2.tourId).toBe(tourId);
    const b = zoneOf(s, 'B');
    expect(b.stock.rawA).toBeGreaterThanOrEqual(3 * vehicleConfig.truckCapacity);
  });

  it('Farbe und Name ändern lässt Halte und LKW in Ruhe', () => {
    const s = testWorld();
    const t = buy(s);
    const tourId = giveTour(s, t.id, aToB(s));
    s.run(40);
    const phase = t.phase;
    expect(s.execute({ type: 'tour/update', tourId, color: 4, name: 'Neu' }).ok).toBe(true);
    expect(s.state.tours[0]).toMatchObject({ color: 4, name: 'Neu', stops: aToB(s) });
    expect(t.phase).toBe(phase);
  });

  it('Tour löschen: ihre LKW fahren wieder Automatik', () => {
    const s = testWorld();
    const t = buy(s);
    const tourId = giveTour(s, t.id, aToB(s));
    expect(s.execute({ type: 'tour/delete', tourId }).ok).toBe(true);
    expect(s.state.tours).toHaveLength(0);
    expect(t.tourId).toBeNull();
    expect(s.execute({ type: 'tour/delete', tourId }).ok).toBe(false);
  });

  it('unbekannte Tour kann nicht zugewiesen werden', () => {
    const s = testWorld();
    const t = buy(s);
    expect(s.execute({ type: 'vehicle/assignTour', truckId: t.id, tourId: 999 }).ok).toBe(false);
    expect(t.tourId).toBeNull();
  });
});
