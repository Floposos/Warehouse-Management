import { vehicleConfig } from '../../config/vehicles';
import { exportPrice } from '../goods/export';
import { stores } from '../goods/stock';
import type { GameState } from '../state/gameState';
import { sites } from '../world/sites';
import type { TourStop, Truck } from './types';

function truckOf(state: GameState, id: number): Truck | null {
  const v = state.vehicles.find((x) => x.id === id);
  return v?.kind === 'truck' ? v : null;
}

/** Umschalten Automatik/Tour. Ladung bleibt an Bord; der laufende Auftrag entfällt. */
export function setTruckMode(state: GameState, id: number, mode: Truck['mode']): boolean {
  const t = truckOf(state, id);
  if (!t) return false;
  if (t.mode === mode) return true;
  t.mode = mode;
  t.job = null;
  t.phase = 'idle';
  t.idleReason = null;
  t.timer = 1;
  t.tourIndex = 0;
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

export type TourRejection = 'notFound' | 'invalidStop' | 'tooManyStops';

/** Ersetzt die Tour; der LKW fährt danach mit dem ersten Halt fort. */
export function setTruckTour(
  state: GameState,
  id: number,
  stops: readonly TourStop[],
): TourRejection | null {
  const t = truckOf(state, id);
  if (!t) return 'notFound';
  if (stops.length > vehicleConfig.tourMaxStops) return 'tooManyStops';
  if (!stops.every((s) => isValidStop(state, s))) return 'invalidStop';
  t.tour = stops.map((s) => ({ ...s }));
  t.tourIndex = 0;
  if (t.mode === 'tour') {
    t.phase = 'idle';
    t.timer = 1;
  }
  return null;
}
