import { vehicleConfig } from '../../config/vehicles';
import type { ProductId } from '../../content/products';
import { exportPrice } from '../goods/export';
import { available, freeSpace } from '../goods/stock';
import type { GameState } from '../state/gameState';
import type { Cell } from '../world/roadLine';
import type { RoadNetwork } from '../world/roadNetwork';
import { siteAccess, sites, type Site } from '../world/sites';
import { planRoute } from './movement';
import type { Job } from './types';

/** Ein Ziel für eine Ware samt freiem Platz (Infinity bei der Export-Ausfahrt). */
interface Drop {
  site: Site;
  free: number;
}

/** Wohin eine Ware gebracht werden kann, in Reihenfolge der Vorliebe. */
export function dropsFor(state: GameState, product: ProductId): Drop[] {
  const all = sites(state);
  const zoneDrops = (kind: 'B' | 'C'): Drop[] =>
    all.flatMap((site) => {
      const zone = state.zones.find((z) => z.id === site.id && z.kind === kind);
      const free = zone ? freeSpace(state, zone, product) : 0;
      return free > 0 ? [{ site, free }] : [];
    });
  const exits = (): Drop[] =>
    exportPrice(product) === null
      ? []
      : all.filter((s) => s.kind === 'export').map((site) => ({ site, free: Infinity }));
  switch (product) {
    case 'rawA':
      return zoneDrops('B');
    case 'combo': {
      // Lieber zur Weiterverarbeitung nach C; ist dort kein Platz, direkt in den Export.
      const toC = zoneDrops('C');
      return toC.length > 0 ? toC : exits();
    }
    case 'final':
      return exits();
    case 'rawB':
      return [];
  }
}

/** Fahraufträge in Reihenfolge der Dringlichkeit: erst Ware hinaus, dann weiter vorn in der Kette. */
const PRIORITY: readonly { product: ProductId; from: 'A' | 'B' | 'C' }[] = [
  { product: 'final', from: 'C' },
  { product: 'combo', from: 'B' },
  { product: 'rawA', from: 'A' },
];

export interface PlannedJob {
  job: Job;
  /** Zufahrt der Quelle. */
  target: Cell;
}

/**
 * Automatik: sucht die dringendste machbare Fahrt (Quelle mit dem meisten abholbereiten
 * Bestand, erreichbares Ziel mit Platz). null = nichts zu tun.
 */
export function findJob(
  state: GameState,
  network: RoadNetwork,
  position: Cell,
): PlannedJob | 'noRoute' | null {
  let unreachable = false;
  for (const { product, from } of PRIORITY) {
    const sources = state.zones
      .filter((z) => z.kind === from)
      .map((zone) => ({ zone, avail: available(state, zone, product) }))
      .filter((s) => s.avail >= Math.min(vehicleConfig.truckMinLoad, vehicleConfig.truckCapacity))
      .sort((a, b) => b.avail - a.avail || a.zone.id - b.zone.id);
    for (const source of sources) {
      const sourceSite = sites(state).find((s) => s.id === source.zone.id);
      const pickup = sourceSite ? siteAccess(network, sourceSite) : null;
      const toPickup = pickup ? planRoute(network, position, pickup) : null;
      if (!pickup || !toPickup) {
        unreachable = true;
        continue;
      }
      for (const drop of dropsFor(state, product)) {
        const access = siteAccess(network, drop.site);
        if (!access || !planRoute(network, pickup, access)) {
          unreachable = true;
          continue;
        }
        const quantity = Math.min(vehicleConfig.truckCapacity, source.avail, drop.free);
        if (quantity < 1) continue;
        return {
          job: { product, fromId: source.zone.id, toId: drop.site.id, quantity },
          target: pickup,
        };
      }
    }
  }
  return unreachable ? 'noRoute' : null;
}
