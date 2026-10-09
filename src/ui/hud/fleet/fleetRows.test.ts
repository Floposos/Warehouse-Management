import { describe, expect, it } from 'vitest';
import { testWorld } from '../../../sim/goods/testWorld';
import type { Truck } from '../../../sim/vehicles/types';
import { fleetRows } from './fleetRows';

function world() {
  const s = testWorld();
  for (const [model, drive] of [
    ['truck', 'diesel'],
    ['van', 'electric'],
    ['truck', 'electric'],
  ] as const) {
    s.execute({ type: 'vehicle/buy', model, drive, lease: false });
  }
  const trucks = s.state.vehicles as Truck[];
  return { s, trucks };
}

describe('Flottenfenster: Zeilen (T2.8)', () => {
  it('zeigt Name, Typ, Status, Tour und Zustand', () => {
    const { s } = world();
    const rows = fleetRows(s.state, 'all', 'name');
    expect(rows.map((r) => r.name)).toEqual(['LKW 1', 'LKW 2', 'Transporter 1']);
    expect(rows[2]).toMatchObject({
      type: 'Transporter Elektro',
      tour: 'Automatik',
      condition: 100,
    });
  });

  it('filtert nach Typ, Wartung, Panne und wartend', () => {
    const { s, trucks } = world();
    expect(fleetRows(s.state, 'van', 'name')).toHaveLength(1);
    expect(fleetRows(s.state, 'truck', 'name')).toHaveLength(2);
    expect(fleetRows(s.state, 'service', 'name')).toHaveLength(0);
    if (trucks[0]) trucks[0].upkeep.condition = 10_000;
    if (trucks[1]) trucks[1].upkeep.brokenTicks = 5;
    expect(fleetRows(s.state, 'service', 'name').map((r) => r.name)).toEqual(['LKW 1']);
    expect(fleetRows(s.state, 'broken', 'name').map((r) => r.name)).toEqual(['Transporter 1']);
    expect(fleetRows(s.state, 'idle', 'name')).toHaveLength(3);
  });

  it('sortiert nach Zustand, schlechtester zuerst', () => {
    const { s, trucks } = world();
    if (trucks[2]) trucks[2].upkeep.condition = 50_000;
    const rows = fleetRows(s.state, 'all', 'condition');
    expect(rows[0]).toMatchObject({ name: 'LKW 2', condition: 50 });
  });
});
