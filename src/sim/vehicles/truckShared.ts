import { vehicleConfig } from '../../config/vehicles';
import type { EventBus } from '../core/eventBus';
import { sellAtExit } from '../goods/export';
import { addStock, freeSpace } from '../goods/stock';
import type { GameState } from '../state/gameState';
import type { Cell } from '../world/roadLine';
import type { RoadNetwork } from '../world/roadNetwork';
import { siteAccess, sites } from '../world/sites';
import { advance, planRoute } from './movement';
import type { Truck, TruckIdleReason } from './types';

export function goIdle(t: Truck, reason: TruckIdleReason | null): void {
  t.phase = 'idle';
  t.idleReason = reason;
  t.timer = vehicleConfig.truckIdleCheckTicks;
}

/** Zufahrt eines Orts (Zone oder Export-Ausfahrt); null = Ort fehlt oder ohne Straße. */
export function accessOf(state: GameState, network: RoadNetwork, siteId: number): Cell | null {
  const site = sites(state).find((s) => s.id === siteId);
  return site ? siteAccess(network, site) : null;
}

/**
 * Setzt einen neuen Weg zum Ziel. Steht der LKW zwischen zwei Feldern, fährt er erst
 * auf das nächste Feld weiter (kein Rucken). false = kein Weg.
 */
export function setRoute(t: Truck, network: RoadNetwork, target: Cell): boolean {
  const [here, next] = t.route;
  if (!here) return false;
  if (t.progress > 0 && next) {
    const rest = planRoute(network, next, target);
    if (rest) {
      t.route = [here, ...rest];
      return true;
    }
  }
  const route = planRoute(network, here, target);
  if (!route) return false;
  t.route = route;
  t.progress = 0;
  return true;
}

/** Fährt weiter und zählt die Strecke. 'blocked' = Straße unterbrochen, neu planen. */
export function drive(t: Truck, network: RoadNetwork): 'arrived' | 'blocked' | 'driving' {
  const { arrived, blocked, moved } = advance(t, vehicleConfig.truckSpeed, network);
  t.odometer += moved;
  if (blocked) {
    t.progress = 0;
    return 'blocked';
  }
  return arrived ? 'arrived' : 'driving';
}

/**
 * Lädt am Ort `siteId` ab, so viel passt (Zone) bzw. verkauft alles (Export-Ausfahrt).
 * Leert `t.cargo`, wenn nichts übrig bleibt. Liefert die abgeladene Menge.
 */
export function unloadAt(state: GameState, bus: EventBus, t: Truck, siteId: number): number {
  const cargo = t.cargo;
  if (!cargo) return 0;
  const zone = state.zones.find((z) => z.id === siteId);
  let quantity = 0;
  if (zone) {
    // Eigene Ladung ist im Platz bereits als „unterwegs“ eingerechnet (Automatik).
    const own = t.job?.toId === siteId ? cargo.quantity : 0;
    quantity = Math.min(cargo.quantity, freeSpace(state, zone, cargo.product) + own);
    if (quantity > 0) {
      addStock(zone, cargo.product, quantity);
      bus.emit({ type: 'goods/delivered', zoneId: zone.id, product: cargo.product, quantity });
    }
  } else if (sellAtExit(state, bus, siteId, cargo.product, cargo.quantity) !== null) {
    quantity = cargo.quantity;
  }
  cargo.quantity -= quantity;
  if (cargo.quantity <= 0) t.cargo = null;
  return quantity;
}
