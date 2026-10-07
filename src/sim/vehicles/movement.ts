import { vehicleConfig } from '../../config/vehicles';
import type { Vehicle } from '../state/gameState';
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

/** Weg vom aktuellen Feld zum Ziel; null = kein Weg. */
export function planRoute(network: RoadNetwork, from: Cell, to: Cell): Cell[] | null {
  if (from.x < ENTRANCE.x) {
    const rest = findPath(network, ENTRANCE, to);
    if (!rest) return null;
    const lane: Cell[] = [];
    for (let x = from.x; x < ENTRANCE.x; x++) lane.push({ x, z: ENTRANCE.z });
    return [...lane, ...rest];
  }
  return findPath(network, from, to);
}

/**
 * Fährt `speed` Tausendstel Feld weiter. Liefert true bei Ankunft am Routenende.
 * Liegt das nächste Feld nicht mehr auf einer Straße, bleibt das Fahrzeug stehen (false)
 * und `blocked` meldet das; der Aufrufer plant dann neu.
 */
export function advance(
  vehicle: Vehicle,
  speed: number,
  network: RoadNetwork,
): { arrived: boolean; blocked: boolean } {
  let budget = speed;
  while (vehicle.route.length > 1) {
    const next = vehicle.route[1] as Cell;
    if (!drivable(network, next)) return { arrived: false, blocked: true };
    const step = Math.min(budget, CELL - vehicle.progress);
    vehicle.progress += step;
    budget -= step;
    if (vehicle.progress < CELL) return { arrived: false, blocked: false };
    vehicle.route.shift();
    vehicle.progress = 0;
  }
  return { arrived: true, blocked: false };
}
