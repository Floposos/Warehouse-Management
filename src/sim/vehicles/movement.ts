import { vehicleConfig } from '../../config/vehicles';
import { headingBetween } from '../traffic/lanes';
import type { Traffic } from '../traffic/traffic';
import type { Vehicle } from './types';
import { findPath } from '../world/pathfinding';
import type { Cell } from '../world/roadLine';
import { ENTRANCE, type RoadNetwork } from '../world/roadNetwork';

/** Tausendstel je Feld. */
export const CELL = 1000;

/** Fahrweg außerhalb des Geländes auf der Eingangsstraße (von außen bis vor die Einfahrt). */
export function outsideLane(): Cell[] {
  const cells: Cell[] = [];
  for (let i = vehicleConfig.outsideCells; i >= 2; i--)
    cells.push({ x: ENTRANCE.x - i + 1, z: ENTRANCE.z });
  return cells;
}

/** Felder außerhalb des Geländes (Eingangsstraße) sind immer befahrbar. */
export function drivable(network: RoadNetwork, c: Cell): boolean {
  return c.x < ENTRANCE.x || network.has(c.x, c.z);
}

/** Weg vom aktuellen Feld zum Ziel; null = kein Weg. `avoid`: Felder, die gemieden werden. */
export function planRoute(
  network: RoadNetwork,
  from: Cell,
  to: Cell,
  avoid?: ReadonlySet<number>,
): Cell[] | null {
  if (from.x < ENTRANCE.x) {
    const rest = findPath(network, ENTRANCE, to, avoid);
    if (!rest) return null;
    const lane: Cell[] = [];
    for (let x = from.x; x < ENTRANCE.x; x++) lane.push({ x, z: ENTRANCE.z });
    return [...lane, ...rest];
  }
  return findPath(network, from, to, avoid);
}

export interface AdvanceResult {
  /** Am Routenende. */
  arrived: boolean;
  /** Nächstes Feld ist keine Straße mehr: neu planen. */
  blocked: boolean;
  /** Steht im Verkehr (Spur belegt, keine Kreuzungsfreigabe). */
  waiting: boolean;
  /** Gefahrene Strecke in Tausendstel Feld. */
  moved: number;
}

/**
 * Fährt `speed` Tausendstel Feld weiter. Vor jedem neuen Feld fragt das Fahrzeug den Verkehr
 * (T2.2): Ist die Spur belegt oder fehlt die Kreuzungsfreigabe, wartet es an der Feldgrenze.
 * Wer abseits stand (Stellplatz, geparkt), fädelt dabei wieder ein.
 */
export function advance(vehicle: Vehicle, speed: number, traffic: Traffic): AdvanceResult {
  let budget = speed;
  const result = (arrived: boolean, blocked: boolean, waiting: boolean): AdvanceResult => ({
    arrived,
    blocked,
    waiting,
    moved: speed - budget,
  });
  while (vehicle.route.length > 1) {
    const here = vehicle.route[0] as Cell;
    const next = vehicle.route[1] as Cell;
    if (!drivable(traffic.network, next)) return result(false, true, false);
    const heading = headingBetween(here, next);
    if (vehicle.progress === 0) {
      if (!traffic.canEnter(vehicle)) return result(false, false, budget === speed);
      if (vehicle.offRoad) {
        vehicle.offRoad = false;
        vehicle.heading = heading;
        traffic.claim(vehicle, here, heading);
      }
      traffic.claim(vehicle, next, heading);
      traffic.gate?.pass(here, next);
    }
    const step = Math.min(budget, CELL - vehicle.progress);
    vehicle.progress += step;
    budget -= step;
    if (vehicle.progress < CELL) return result(false, false, false);
    traffic.release(vehicle, here, vehicle.heading);
    vehicle.route.shift();
    vehicle.progress = 0;
    vehicle.heading = heading;
  }
  return result(true, false, false);
}
