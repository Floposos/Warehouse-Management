import { exportPrice } from '../goods/export';
import { stores } from '../goods/stock';
import type { GameState } from '../state/gameState';
import { sites } from '../world/sites';
import type { TourStop, Truck } from './types';

export function truckOf(state: GameState, id: number): Truck | null {
  const v = state.vehicles.find((x) => x.id === id);
  return v?.kind === 'truck' ? v : null;
}

/** Laufenden Auftrag verwerfen und neu beginnen; Ladung bleibt an Bord. */
export function restartTruck(t: Truck): void {
  t.job = null;
  t.phase = 'idle';
  t.idleReason = null;
  t.timer = 1;
  t.tourIndex = 0;
  t.upkeep.workshopId = null;
}

/**
 * „Zur Werkstatt“ (T2.6): nach dem laufenden Auftrag bzw. Halt zur nächsten Werkstatt.
 * null = angenommen.
 */
export function requestService(
  state: GameState,
  truckId: number,
): 'notFound' | 'noWorkshop' | null {
  const t = truckOf(state, truckId);
  if (!t) return 'notFound';
  if (!state.zones.some((z) => z.kind === 'W')) return 'noWorkshop';
  t.upkeep.serviceRequested = true;
  t.upkeep.warnedNoWorkshop = false;
  return null;
}

/**
 * Tour zuweisen (T2.1); null = Automatik. Die Ladung bleibt an Bord, der laufende Auftrag
 * entfällt. false = LKW oder Tour unbekannt.
 */
export function assignTour(state: GameState, truckId: number, tourId: number | null): boolean {
  const t = truckOf(state, truckId);
  if (!t || (tourId !== null && !state.tours.some((x) => x.id === tourId))) return false;
  if (t.tourId === tourId) return true;
  t.tourId = tourId;
  restartTruck(t);
  return true;
}

/** Ist der Halt sinnvoll? Laden nur in Zonen, die die Ware lagern; Abladen auch am Export. */
export function isValidStop(state: GameState, stop: TourStop): boolean {
  const site = sites(state).find((s) => s.id === stop.siteId);
  if (!site) return false;
  if (site.kind === 'export') return stop.action === 'unload' && exportPrice(stop.product) !== null;
  const zone = state.zones.find((z) => z.id === site.id);
  return zone !== undefined && stores(zone, stop.product);
}
