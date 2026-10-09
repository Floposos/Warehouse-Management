import { vehicleConfig } from '../../config/vehicles';
import { tourColors } from '../../content/tourColors';
import type { GameState } from '../state/gameState';
import { isValidStop, restartTruck } from './truckCommands';
import type { Tour, TourStop, Truck } from './types';

export type TourRejection =
  'notFound' | 'invalidStop' | 'tooManyStops' | 'invalidName' | 'invalidColor';

/** Änderbare Teile einer Tour; fehlende Felder bleiben, wie sie sind. */
export interface TourPatch {
  name?: string;
  color?: number;
  stops?: readonly TourStop[];
}

export function tourById(state: GameState, id: number | null): Tour | null {
  return id === null ? null : (state.tours.find((t) => t.id === id) ?? null);
}

/** Tour eines LKW (null = Automatik oder Tour fehlt). */
export function tourOf(state: GameState, t: Truck): Tour | null {
  return tourById(state, t.tourId);
}

function check(state: GameState, patch: TourPatch): TourRejection | null {
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (name.length === 0 || name.length > vehicleConfig.tourNameMaxLength) return 'invalidName';
  }
  if (
    patch.color !== undefined &&
    !(Number.isInteger(patch.color) && patch.color >= 0 && patch.color < tourColors.length)
  ) {
    return 'invalidColor';
  }
  if (patch.stops) {
    if (patch.stops.length > vehicleConfig.tourMaxStops) return 'tooManyStops';
    if (!patch.stops.every((s) => isValidStop(state, s))) return 'invalidStop';
  }
  return null;
}

/** Farbe für eine neue Tour: die am wenigsten benutzte, bei Gleichstand die erste. */
export function suggestColor(state: GameState): number {
  const used = tourColors.map((_, i) => state.tours.filter((t) => t.color === i).length);
  return used.indexOf(Math.min(...used));
}

/** Legt eine Tour an. Ohne Name heißt sie „Tour <Id>“ (die Oberfläche schickt einen Namen). */
export function createTour(state: GameState, patch: TourPatch): Tour | TourRejection {
  const rejection = check(state, patch);
  if (rejection) return rejection;
  const id = state.nextId++;
  const tour: Tour = {
    id,
    name: patch.name?.trim() ?? `Tour ${id}`,
    color: patch.color ?? suggestColor(state),
    stops: (patch.stops ?? []).map((s) => ({ ...s })),
  };
  state.tours.push(tour);
  return tour;
}

/** Ändert Name, Farbe oder Halte. Neue Halte: alle LKW der Tour beginnen beim ersten Halt. */
export function updateTour(state: GameState, id: number, patch: TourPatch): TourRejection | null {
  const tour = tourById(state, id);
  if (!tour) return 'notFound';
  const rejection = check(state, patch);
  if (rejection) return rejection;
  if (patch.name !== undefined) tour.name = patch.name.trim();
  if (patch.color !== undefined) tour.color = patch.color;
  if (patch.stops) {
    tour.stops = patch.stops.map((s) => ({ ...s }));
    for (const t of trucksOn(state, id)) restartTruck(t);
  }
  return null;
}

/** Löscht eine Tour. ANNAHME (T2.1): Ihre LKW fahren danach in der Automatik. */
export function deleteTour(state: GameState, id: number): boolean {
  if (!tourById(state, id)) return false;
  for (const t of trucksOn(state, id)) {
    t.tourId = null;
    restartTruck(t);
  }
  state.tours = state.tours.filter((t) => t.id !== id);
  return true;
}

export function trucksOn(state: GameState, tourId: number): Truck[] {
  return state.vehicles.filter((v): v is Truck => v.kind === 'truck' && v.tourId === tourId);
}
