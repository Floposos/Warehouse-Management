import { createInitialState, type GameState } from '../state/gameState';
import { advance } from '../vehicles/movement';
import { vehicleBase, type Supplier } from '../vehicles/types';
import type { Cell } from '../world/roadLine';
import { RoadNetwork } from '../world/roadNetwork';
import { headingBetween, laneKey } from './lanes';
import { Traffic } from './traffic';

/** Testaufbau (nur für Tests): Straßen aus Feldern, Fahrzeuge mit festen Wegen. */
export function trafficWorld(cells: Cell[], priority: Cell[] = []): GameState {
  const state = createInitialState(1);
  state.buildings = [];
  const isPriority = (c: Cell) => priority.some((p) => p.x === c.x && p.z === c.z);
  state.roads = cells.map((c) => ({ ...c, builtTick: 0, paidCents: 0, priority: isPriority(c) }));
  return state;
}

export function line(from: Cell, to: Cell): Cell[] {
  const cells: Cell[] = [];
  const dx = Math.sign(to.x - from.x);
  const dz = Math.sign(to.z - from.z);
  for (let c = { ...from }; ; c = { x: c.x + dx, z: c.z + dz }) {
    cells.push(c);
    if (c.x === to.x && c.z === to.z) return cells;
  }
}

export function addVehicle(state: GameState, route: Cell[]): Supplier {
  const v: Supplier = {
    ...vehicleBase(state.nextId++, route, false),
    kind: 'supplier',
    phase: 'toSite',
    targetId: 0,
    paidCents: 0,
  };
  const [a, b] = route;
  if (a && b) v.heading = headingBetween(a, b);
  state.vehicles.push(v);
  return v;
}

/** Belegte Spuren aller Fahrzeuge auf der Fahrbahn; wirft bei Doppelbelegung. */
export function assertNoOverlap(state: GameState, traffic: Traffic): void {
  const lanes = new Map<number, number>();
  const junctionUse = new Map<string, number>();
  for (const v of state.vehicles) {
    if (v.offRoad) continue;
    const [here, next] = v.route;
    if (!here) continue;
    const held: [Cell, number][] = [[here, laneKey(here, v.heading)]];
    if (v.progress > 0 && next) held.push([next, laneKey(next, headingBetween(here, next))]);
    for (const [c, key] of held) {
      const other = lanes.get(key);
      if (other !== undefined && other !== v.id) {
        throw new Error(`Fahrzeuge ${other} und ${v.id} auf derselben Spur bei ${c.x},${c.z}`);
      }
      lanes.set(key, v.id);
      if (traffic.isJunction(c)) {
        const id = `${c.x},${c.z}`;
        const prev = junctionUse.get(id);
        if (prev !== undefined && prev !== v.id) {
          throw new Error(`Fahrzeuge ${prev} und ${v.id} gleichzeitig in der Kreuzung ${id}`);
        }
        junctionUse.set(id, v.id);
      }
    }
  }
}

/** Fährt alle Fahrzeuge einen Schritt (nur Bewegung) und prüft die Spuren. */
export function stepAll(state: GameState, speed = 400): Traffic {
  const traffic = new Traffic(new RoadNetwork(state), state);
  for (const v of state.vehicles) {
    const r = advance(v, speed, traffic);
    if (r.moved > 0) v.waitTicks = 0;
    else if (r.waiting) v.waitTicks += 1;
  }
  assertNoOverlap(state, new Traffic(new RoadNetwork(state), state));
  return traffic;
}
