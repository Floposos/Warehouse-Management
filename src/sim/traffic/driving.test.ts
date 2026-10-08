import { describe, expect, it } from 'vitest';
import { trafficConfig } from '../../config/traffic';
import { EventBus } from '../core/eventBus';
import type { SimEventOf } from '../core/events';
import { TICKS_PER_DAY } from '../core/gameTime';
import { giveTour, testWorld, zoneOf } from '../goods/testWorld';
import type { GameState } from '../state/gameState';
import type { Vehicle } from '../vehicles/types';
import type { Cell } from '../world/roadLine';
import { RoadNetwork } from '../world/roadNetwork';
import { bayCapacity } from './bays';
import { driveVehicle } from './driving';
import { Traffic } from './traffic';
import { addVehicle, assertNoOverlap, line, trafficWorld } from './trafficTestKit';

const at = (x: number, z: number): Cell => ({ x, z });

function drive(state: GameState, bus: EventBus, vehicles: Vehicle[]): void {
  const traffic = new Traffic(new RoadNetwork(state), state);
  for (const v of vehicles) driveVehicle({ state, bus, traffic }, v, 400);
  bus.flush();
}

describe('Stellplätze am Tor (T2.3)', () => {
  it('wachsen mit der Zonengröße, mindestens einer', () => {
    const s = testWorld();
    const a = zoneOf(s, 'A');
    expect(bayCapacity(s.state, a.id)).toBe(2); // 3 × 3 Felder
    a.parts = [{ x: 10, z: 50, width: 1, depth: 1, builtTick: 0, paidCents: 0 }];
    expect(bayCapacity(s.state, a.id)).toBe(1);
    a.parts = [{ x: 0, z: 0, width: 20, depth: 20, builtTick: 0, paidCents: 0 }];
    expect(bayCapacity(s.state, a.id)).toBe(trafficConfig.maxBays);
    const exit = s.state.buildings.find((b) => b.type === 'exportExit');
    expect(bayCapacity(s.state, exit?.id ?? -1)).toBe(trafficConfig.exportBays);
  });

  it('nur so viele LKW laden gleichzeitig, wie es Stellplätze gibt; der Rest wartet davor', () => {
    const s = testWorld();
    const a = zoneOf(s, 'A');
    a.stock.rawA = 300;
    const stops = [
      { siteId: a.id, action: 'load' as const, product: 'rawA' as const },
      { siteId: zoneOf(s, 'B').id, action: 'unload' as const, product: 'rawA' as const },
    ];
    for (let i = 0; i < 4; i++) s.execute({ type: 'vehicle/buyTruck' });
    const trucks = s.state.vehicles;
    const tourId = giveTour(s, trucks[0]?.id ?? -1, stops);
    for (const t of trucks) s.execute({ type: 'vehicle/assignTour', truckId: t.id, tourId });
    let full = false;
    let queued = false;
    for (let i = 0; i < TICKS_PER_DAY / 6; i++) {
      s.step();
      const inBay = trucks.filter((t) => t.bayAt === a.id).length;
      expect(inBay).toBeLessThanOrEqual(2);
      full ||= inBay === 2;
      queued ||= inBay === 2 && trucks.some((t) => t.waitTicks > 0 && t.bayAt === null);
    }
    expect(full).toBe(true);
    expect(queued).toBe(true);
  });
});

describe('Verkehr im ganzen Spiel', () => {
  it('zehn LKW und Zulieferer: nie zwei Fahrzeuge auf einer Spur', () => {
    const s = testWorld();
    s.execute({ type: 'order/create', product: 'rawA', quantity: 60, interval: 'daily' });
    s.execute({ type: 'order/create', product: 'rawB', quantity: 40, interval: 'daily' });
    for (let i = 0; i < 10; i++) s.execute({ type: 'vehicle/buyTruck' });
    let delivered = 0;
    s.bus.on('goods/delivered', (e) => (delivered += e.quantity));
    for (let i = 0; i < TICKS_PER_DAY; i++) {
      s.step();
      assertNoOverlap(s.state, new Traffic(new RoadNetwork(s.state), s.state));
    }
    // Zulieferer (100) und LKW (A → B, B → C) haben geliefert, der Verkehr fließt.
    expect(delivered).toBeGreaterThan(150);
  });
});

describe('Stau (T2.4)', () => {
  /** Zwei Wege von (0, 0) nach (10, 0): gerade oder über z = 4. */
  const LOOP = [
    ...line(at(0, 0), at(10, 0)),
    ...line(at(0, 1), at(0, 4)),
    ...line(at(1, 4), at(10, 4)),
    ...line(at(10, 1), at(10, 3)),
  ];

  it('sucht nach kurzer Wartezeit einen Umweg um ein stehendes Fahrzeug', () => {
    const state = trafficWorld(LOOP);
    const blocker = addVehicle(state, [at(5, 0)]);
    const v = addVehicle(state, line(at(0, 0), at(10, 0)));
    const bus = new EventBus();
    for (let i = 0; i < 200 && v.route.length > 1; i++) drive(state, bus, [blocker, v]);
    expect(v.route).toEqual([at(10, 0)]);
    expect(blocker.route).toEqual([at(5, 0)]);
  });

  it('ohne Umweg: Warnung „Stau“ nach der eingestellten Zeit', () => {
    const state = trafficWorld(line(at(0, 0), at(10, 0)));
    const blocker = addVehicle(state, [at(5, 0)]);
    const v = addVehicle(state, line(at(0, 0), at(10, 0)));
    const bus = new EventBus();
    const jams: SimEventOf<'traffic/jam'>[] = [];
    bus.on('traffic/jam', (e) => jams.push(e));
    for (let i = 0; i < trafficConfig.jamWarnTicks + 40; i++) drive(state, bus, [blocker, v]);
    expect(v.route[0]).toEqual(at(4, 0));
    expect(jams).toEqual([{ type: 'traffic/jam', vehicleId: v.id, x: 4, z: 0 }]);
  });
});
