import type { Vehicle } from '../vehicles/types';
import type { Cell } from '../world/roadLine';
import { cellKey } from '../world/roadNetwork';
import { fromRight, headingBetween } from './lanes';
import type { Traffic } from './traffic';

/**
 * Ist der Weg hinter der Kreuzung frei? Alle folgenden Kreuzungsfelder müssen leer sein,
 * und auf dem ersten Feld danach muss die Spur frei sein. So bleibt niemand in der
 * Kreuzung stehen und versperrt sie („Kreuzung freihalten“).
 */
export function exitClear(traffic: Traffic, route: readonly Cell[]): boolean {
  for (let i = 1; i < route.length; i++) {
    const prev = route[i - 1] as Cell;
    const c = route[i] as Cell;
    if (traffic.isJunction(c)) {
      if (!traffic.cellFree(c)) return false;
      continue;
    }
    return traffic.laneFree(c, headingBetween(prev, c));
  }
  return true;
}

function wantsJunction(traffic: Traffic, v: Vehicle): boolean {
  const [here, next] = v.route;
  if (!here || !next || v.progress !== 0 || !traffic.isJunction(next)) return false;
  if (!v.offRoad) return true;
  const heading = headingBetween(here, next);
  return traffic.isJunction(here) ? traffic.cellFree(here) : traffic.laneFree(here, heading);
}

/**
 * Kreuzungsfreigaben eines Schritts (T2.2, Entscheidung 08.10.2026: Vorfahrtsstraßen
 * markieren). Je freier Kreuzung darf höchstens ein Fahrzeug einfahren:
 * 1. nur wer hinter der Kreuzung Platz hat;
 * 2. wer von einer Vorfahrtsstraße kommt, vor allen anderen;
 * 3. ANNAHME: sonst rechts vor links;
 * 4. kommt von jeder Seite jemand (oder bleibt sonst ein Gleichstand), wer am längsten wartet,
 *    dann die kleinere Id.
 */
export function grantJunctions(traffic: Traffic, vehicles: readonly Vehicle[]): Set<number> {
  const requests = new Map<number, Vehicle[]>();
  for (const v of vehicles) {
    if (!wantsJunction(traffic, v)) continue;
    const next = v.route[1] as Cell;
    const key = cellKey(next.x, next.z);
    const list = requests.get(key);
    if (list) list.push(v);
    else requests.set(key, [v]);
  }
  const granted = new Set<number>();
  for (const list of requests.values()) {
    const junction = list[0]?.route[1];
    if (!junction || !traffic.cellFree(junction)) continue;
    const eligible = list.filter((v) => exitClear(traffic, v.route));
    const main = eligible.filter((v) => {
      const here = v.route[0] as Cell;
      return traffic.priority.has(cellKey(here.x, here.z));
    });
    const pool = main.length > 0 ? main : eligible;
    const heading = (v: Vehicle) => headingBetween(v.route[0] as Cell, v.route[1] as Cell);
    const yieldsTo = (v: Vehicle) =>
      pool.some((o) => o !== v && heading(o) === fromRight(heading(v)));
    const free = pool.filter((v) => !yieldsTo(v));
    const winner = (free.length > 0 ? free : pool).reduce<Vehicle | null>(
      (best, v) =>
        !best || v.waitTicks > best.waitTicks || (v.waitTicks === best.waitTicks && v.id < best.id)
          ? v
          : best,
      null,
    );
    if (winner) granted.add(winner.id);
  }
  return granted;
}
