import { autoRouteColor, tourColors } from '../../content/tourColors';
import type { GameState } from '../../sim/state/gameState';
import type { Vehicle } from '../../sim/vehicles/types';

/** Farbe des Wegs bzw. des Farbpunkts eines Fahrzeugs: Tourfarbe, sonst Grau (T2.1). */
export function routeColorOf(state: Readonly<GameState>, v: Vehicle): number {
  if (v.kind !== 'truck' || v.tourId === null) return autoRouteColor;
  const tour = state.tours.find((t) => t.id === v.tourId);
  return tour ? (tourColors[tour.color] ?? autoRouteColor) : autoRouteColor;
}
