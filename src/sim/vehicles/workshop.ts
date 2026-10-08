import { maintenanceConfig as mc } from '../../config/maintenance';
import type { GameState } from '../state/gameState';
import { siteAccess, sites } from '../world/sites';
import { planRoute } from './movement';
import { drive, goIdle, setRoute } from './truckShared';
import type { Truck } from './types';
import { finishService, needsService, warnNoWorkshop } from './upkeep';
import type { VehicleCtx } from './vehicleCtx';

/** Werkstätten (Zonenart W, T2.6). */
export function workshops(state: GameState): GameState['zones'] {
  return state.zones.filter((z) => z.kind === 'W');
}

/** Nächste erreichbare Werkstatt (kürzester Weg); null = keine. */
function nearestWorkshop(ctx: VehicleCtx, t: Truck): number | null {
  const here = t.route[0];
  if (!here) return null;
  const network = ctx.traffic.network;
  let best: { id: number; length: number } | null = null;
  for (const site of sites(ctx.state)) {
    if (site.kind !== 'W') continue;
    const access = siteAccess(network, site);
    const route = access ? planRoute(network, here, access) : null;
    if (route && (!best || route.length < best.length))
      best = { id: site.id, length: route.length };
  }
  return best?.id ?? null;
}

function headTo(ctx: VehicleCtx, t: Truck, workshopId: number): boolean {
  const site = sites(ctx.state).find((s) => s.id === workshopId);
  const access = site ? siteAccess(ctx.traffic.network, site) : null;
  return access !== null && setRoute(t, ctx.traffic.network, access);
}

/**
 * Entscheidungspunkt (Fahrzeug wartet und will gleich weiter): Ist Wartung fällig, zur
 * nächsten Werkstatt fahren. Ohne erreichbare Werkstatt einmal melden und weiterarbeiten.
 * true = fährt zur Werkstatt.
 */
export function maybeStartService(ctx: VehicleCtx, t: Truck): boolean {
  if (t.phase !== 'idle' || t.timer > 1 || !needsService(t)) return false;
  if (t.tourId === null && t.cargo) return false;
  const id = nearestWorkshop(ctx, t);
  if (id === null || !headTo(ctx, t, id)) {
    t.upkeep.serviceRequested = false;
    warnNoWorkshop(ctx, t);
    return false;
  }
  t.upkeep.workshopId = id;
  t.phase = 'toWorkshop';
  t.idleReason = null;
  return true;
}

/** Fahrt zur Werkstatt und Wartung; true = dieser Schritt ist damit erledigt. */
export function stepWorkshop(ctx: VehicleCtx, t: Truck): boolean {
  if (t.phase !== 'toWorkshop' && t.phase !== 'servicing') return false;
  const id = t.upkeep.workshopId;
  if (id === null || !ctx.state.zones.some((z) => z.id === id && z.kind === 'W')) {
    t.upkeep.workshopId = null;
    goIdle(ctx, t, null);
    t.timer = 1;
    return true;
  }
  if (t.phase === 'toWorkshop') {
    const result = drive(ctx, t, id);
    if (result === 'blocked' && !headTo(ctx, t, id)) {
      t.upkeep.workshopId = null;
      goIdle(ctx, t, 'noRoute');
    } else if (result === 'arrived') {
      t.phase = 'servicing';
      t.timer = mc.serviceTicks;
    }
    return true;
  }
  if (--t.timer > 0) return true;
  finishService(ctx, t);
  goIdle(ctx, t, null);
  t.timer = 1;
  return true;
}
