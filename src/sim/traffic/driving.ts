import { trafficConfig } from '../../config/traffic';
import { addNotice } from '../events/notices';
import { advance, planRoute } from '../vehicles/movement';
import type { Vehicle } from '../vehicles/types';
import type { VehicleCtx } from '../vehicles/vehicleCtx';
import type { Cell } from '../world/roadLine';
import { cellKey } from '../world/roadNetwork';
import { bayCapacity } from './bays';

export type DriveResult = 'arrived' | 'blocked' | 'driving' | 'waiting';

/** Ein Schritt Fahrt mit Verkehr; zählt Wartezeit, warnt bei Stau, sucht Umwege. */
export function driveVehicle(
  ctx: VehicleCtx,
  v: Vehicle,
  speed: number,
): { result: DriveResult; moved: number } {
  const r = advance(v, speed, ctx.traffic);
  if (r.moved > 0) v.waitTicks = 0;
  if (r.blocked) return { result: 'blocked', moved: r.moved };
  if (r.waiting) {
    noteWait(ctx, v, true);
    return { result: 'waiting', moved: r.moved };
  }
  return { result: r.arrived ? 'arrived' : 'driving', moved: r.moved };
}

/**
 * Wartezeit zählen (T2.4, Entscheidung 08.10.2026: warnen und Umweg suchen). Nach
 * `jamWarnTicks` meldet das Fahrzeug einen Stau; im Verkehr sucht es ab `detourAfterTicks`
 * regelmäßig einen Weg, der das versperrte Feld meidet.
 */
export function noteWait(ctx: VehicleCtx, v: Vehicle, mayDetour: boolean): void {
  v.waitTicks += 1;
  const here = v.route[0];
  if (v.waitTicks === trafficConfig.jamWarnTicks && here) {
    ctx.bus.emit({ type: 'traffic/jam', vehicleId: v.id, x: here.x, z: here.z });
    addNotice(ctx.state, ctx.bus, { kind: 'jam', x: here.x, z: here.z, vehicleId: v.id });
  }
  const { detourAfterTicks: after, detourEveryTicks: every } = trafficConfig;
  if (mayDetour && v.waitTicks >= after && (v.waitTicks - after) % every === 0) {
    tryDetour(ctx, v);
  }
}

/** Umweg um das nächste (versperrte) Feld; true = neuer Weg gesetzt. */
export function tryDetour(ctx: VehicleCtx, v: Vehicle): boolean {
  const [here, blocked] = v.route;
  const target = v.route.at(-1);
  if (!here || !blocked || !target || v.progress !== 0) return false;
  if (blocked.x === target.x && blocked.z === target.z) return false;
  const avoid = new Set([cellKey(blocked.x, blocked.z)]);
  const route = planRoute(ctx.traffic.network, here, target, avoid);
  if (!route || route.length < 2) return false;
  v.route = route as Cell[];
  return true;
}

/** Am Ziel: Stellplatz nehmen (T2.3) oder in der Schlange warten. true = Stellplatz belegt. */
export function enterBay(ctx: VehicleCtx, v: Vehicle, siteId: number): boolean {
  if (ctx.traffic.takeBay(v, siteId, bayCapacity(ctx.state, siteId))) {
    v.waitTicks = 0;
    return true;
  }
  noteWait(ctx, v, false);
  return false;
}
