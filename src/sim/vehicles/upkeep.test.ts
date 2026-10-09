import { describe, expect, it } from 'vitest';
import { maintenanceConfig as mc } from '../../config/maintenance';
import { TICKS_PER_DAY } from '../core/gameTime';
import type { Simulation } from '../core/simulation';
import { testWorld, zoneOf } from '../goods/testWorld';
import { Traffic } from '../traffic/traffic';
import { RoadNetwork } from '../world/roadNetwork';
import type { Truck } from './types';
import { applyWear, breakDown, breakdownChancePerField, kmUntilService } from './upkeep';

function buyTruck(s: Simulation): Truck {
  const r = s.execute({ type: 'vehicle/buy', model: 'truck', drive: 'diesel', lease: false });
  const t = s.state.vehicles.find((v) => v.id === (r.ok ? r.id : -1));
  if (t?.kind !== 'truck') throw new Error('kein LKW');
  return t;
}

function ctxOf(s: Simulation) {
  return { state: s.state, bus: s.bus, traffic: new Traffic(new RoadNetwork(s.state), s.state) };
}

/** Werkstatt 2 × 2 südlich der Hauptstraße, Tor nach Norden. */
function addWorkshop(s: Simulation): number {
  const r = s.execute({ type: 'zone/place', kind: 'W', fromX: 14, fromZ: 62, toX: 15, toZ: 63 });
  if (!r.ok) throw new Error(JSON.stringify(r));
  return s.state.zones.find((z) => z.kind === 'W')?.id ?? -1;
}

/** Bis der LKW auf der Straße fährt (nicht geparkt, nicht auf dem Stellplatz). */
function untilOnRoad(s: Simulation, t: Truck): void {
  for (let i = 0; i < TICKS_PER_DAY && (t.offRoad || t.progress === 0); i++) s.step();
  expect(t.offRoad).toBe(false);
}

describe('Verschleiß (T2.6)', () => {
  it('je gefahrenem Feld 0,004 Prozentpunkte, Rest wird übertragen', () => {
    const s = testWorld();
    const t = buyTruck(s);
    applyWear(ctxOf(s), t, 5500);
    expect(t.upkeep.condition).toBe(mc.fullCondition - 5 * mc.wearPerField);
    expect(t.upkeep.wearRest).toBe(500);
    expect(kmUntilService(t)).toBe(150);
  });

  it('Pannenrisiko: neu nie, steigt mit dem Verschleiß', () => {
    expect(breakdownChancePerField(mc.fullCondition)).toBe(0);
    expect(breakdownChancePerField(40_000)).toBeCloseTo(0.00018, 8);
    expect(breakdownChancePerField(10_000)).toBeGreaterThan(breakdownChancePerField(40_000));
  });

  it('Pannen sind deterministisch und nutzen nur den Ereignis-Zufallsstrom', () => {
    const runs = [testWorld(), testWorld()].map((s) => {
      const t = buyTruck(s);
      t.upkeep.condition = 0;
      t.offRoad = false;
      const rng = { ...s.state.rng };
      applyWear(ctxOf(s), t, 20_000_000); // 200 km
      expect(s.state.rng).toEqual(rng);
      return [t.upkeep.breakdowns, t.upkeep.brokenTicks, s.state.eventRng.s];
    });
    expect(runs[0]?.[0]).toBe(1);
    expect(runs[0]?.[1]).toBe(mc.breakdownTicks);
    expect(runs[0]).toEqual(runs[1]);
  });
});

describe('Panne (T2.6)', () => {
  it('steht 3 Spielstunden, kostet Abschleppen, meldet sich und blockiert die Spur', () => {
    const s = testWorld();
    zoneOf(s, 'A').stock.rawA = 300;
    const t = buyTruck(s);
    untilOnRoad(s, t);
    const follower = buyTruck(s);
    const before = s.state.finance.balanceCents;
    breakDown(ctxOf(s), t);
    s.bus.flush();
    expect(s.state.finance.balanceCents).toBe(before - mc.towCostCents);
    expect(s.state.notices.some((n) => n.kind === 'breakdown' && n.vehicleId === t.id)).toBe(true);
    const where = { route: t.route[0], progress: t.progress };
    t.upkeep.condition = 30_000;
    let followerWaited = false;
    for (let i = 0; i < mc.breakdownTicks - 1; i++) {
      s.step();
      followerWaited ||= follower.waitTicks > 0;
    }
    expect({ route: t.route[0], progress: t.progress }).toEqual(where);
    expect(followerWaited).toBe(true);
    s.step();
    expect(t.upkeep.brokenTicks).toBe(0);
    expect(t.upkeep.condition).toBe(30_000 + mc.breakdownRepair);
    s.run(20);
    expect(t.progress !== where.progress || t.route[0] !== where.route).toBe(true);
  });
});

describe('Werkstatt (T2.6)', () => {
  it('unter 40 % fährt das Fahrzeug zur Werkstatt, wird gewartet und arbeitet weiter', () => {
    const s = testWorld();
    const workshop = addWorkshop(s);
    zoneOf(s, 'A').stock.rawA = 300;
    const t = buyTruck(s);
    t.upkeep.condition = mc.serviceBelow - 1;
    s.run(5);
    expect(t.phase).toBe('toWorkshop');
    expect(t.upkeep.workshopId).toBe(workshop);
    for (let i = 0; i < TICKS_PER_DAY && t.phase !== 'servicing'; i++) s.step();
    expect(t.bayAt).toBe(workshop);
    const before = s.state.finance.balanceCents;
    s.run(mc.serviceTicks);
    expect(t.upkeep.condition).toBe(mc.fullCondition);
    expect(t.upkeep.lastServiceTick).not.toBeNull();
    expect(s.state.finance.balanceCents).toBe(before - mc.serviceCostCents);
    for (let i = 0; i < TICKS_PER_DAY && !t.cargo; i++) s.step();
    expect(t.cargo?.product).toBe('rawA');
  });

  it('ohne Werkstatt: eine Meldung, das Fahrzeug arbeitet weiter', () => {
    const s = testWorld();
    zoneOf(s, 'A').stock.rawA = 300;
    const t = buyTruck(s);
    t.upkeep.condition = 10_000;
    for (let i = 0; i < TICKS_PER_DAY && !t.cargo; i++) s.step();
    expect(t.cargo).not.toBeNull();
    s.run(TICKS_PER_DAY / 2);
    expect(s.state.notices.filter((n) => n.kind === 'noWorkshop')).toHaveLength(1);
  });

  it('„Zur Werkstatt“ nur mit Werkstatt; dann fährt das Fahrzeug hin', () => {
    const s = testWorld();
    const t = buyTruck(s);
    const rejected = s.execute({ type: 'vehicle/service', truckId: t.id });
    expect(rejected).toEqual({ ok: false, reason: 'noWorkshop' });
    addWorkshop(s);
    expect(s.execute({ type: 'vehicle/service', truckId: t.id }).ok).toBe(true);
    for (let i = 0; i < TICKS_PER_DAY && t.phase !== 'servicing'; i++) s.step();
    expect(t.phase).toBe('servicing');
    s.run(mc.serviceTicks);
    expect(t.upkeep.serviceRequested).toBe(false);
  });

  it('Werkstattplätze: einer je angefangene 4 Felder', async () => {
    const { bayCapacity } = await import('../traffic/bays');
    const s = testWorld();
    const id = addWorkshop(s);
    expect(bayCapacity(s.state, id)).toBe(1);
  });
});
