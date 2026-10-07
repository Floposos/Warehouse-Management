import { describe, expect, it } from 'vitest';
import { zoneConfig } from '../../config/zones';
import { Simulation } from '../core/simulation';
import { testWorld, zoneOf } from '../goods/testWorld';
import { createInitialState } from '../state/gameState';
import { zoneCapacity } from './zones';

const zone = (kind: 'A' | 'B' | 'C', fromX: number, fromZ: number, toX: number, toZ: number) =>
  ({ type: 'zone/place', kind, fromX, fromZ, toX, toZ }) as const;

describe('Angrenzende Zonen gleicher Art verschmelzen (Florian, Test 0.2.0)', () => {
  it('Feld direkt neben einer Zone wird Teil dieser Zone', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('A', 40, 40, 42, 42));
    expect(s.execute(zone('A', 43, 40, 43, 40))).toEqual({ ok: true });
    expect(s.state.zones).toHaveLength(1);
    const merged = s.state.zones[0];
    if (!merged) throw new Error('Zone fehlt');
    expect(zoneCapacity(merged)).toBe(10 * zoneConfig.capacityPerField);
  });

  it('Zwischenfeld verbindet zwei Zonen zu einer; Bestand bleibt erhalten', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('C', 40, 40, 41, 41));
    s.execute(zone('C', 43, 40, 44, 41));
    const [left, right] = s.state.zones;
    if (!left || !right) throw new Error('Zonen fehlen');
    left.stock.combo = 7;
    right.stock.final = 3;
    s.execute(zone('C', 42, 40, 42, 40));
    expect(s.state.zones).toHaveLength(1);
    expect(s.state.zones[0]?.id).toBe(left.id);
    expect(s.state.zones[0]?.stock).toMatchObject({ combo: 7, final: 3 });
  });

  it('andere Art oder nur über Eck: keine Verschmelzung', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('A', 40, 40, 41, 41));
    s.execute(zone('B', 42, 40, 42, 41));
    s.execute(zone('A', 42, 42, 42, 42));
    expect(s.state.zones).toHaveLength(3);
  });

  it('LKW-Ziele und Tour-Halte zeigen danach auf die verschmolzene Zone', () => {
    const s = testWorld();
    const b = zoneOf(s, 'B');
    s.execute(zone('B', 24, 62, 25, 64));
    const extra = s.state.zones.at(-1);
    if (!extra || extra.id === b.id) throw new Error('zweite B fehlt');
    s.execute({ type: 'vehicle/buyTruck' });
    const truck = s.state.vehicles.at(-1);
    if (!truck) throw new Error('LKW fehlt');
    s.execute({
      type: 'vehicle/setTour',
      truckId: truck.id,
      stops: [{ siteId: extra.id, action: 'unload', product: 'rawA' }],
    });
    s.execute(zone('B', 23, 62, 23, 64));
    expect(s.state.zones.filter((z) => z.kind === 'B')).toHaveLength(1);
    expect(truck.kind === 'truck' && truck.tour[0]?.siteId).toBe(b.id);
  });

  it('Abriss erstattet jeden Teil nach seinem Bautag', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('A', 40, 40, 41, 41));
    s.execute(zone('A', 42, 40, 42, 41));
    const before = s.state.finance.balanceCents;
    const id = s.state.zones[0]?.id ?? -1;
    expect(s.execute({ type: 'zone/demolish', zoneId: id })).toEqual({ ok: true });
    expect(s.state.finance.balanceCents - before).toBe(6 * zoneConfig.costPerFieldCents.A);
  });
});
