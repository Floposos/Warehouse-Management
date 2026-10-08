import type { GameState } from '../state/gameState';
import { currentStop } from './truckTour';
import type { Vehicle } from './types';

/** Ort, zu dem das Fahrzeug gerade fährt (null = keiner, z. B. wartend oder hinaus). */
export function destinationOf(state: GameState, v: Vehicle): number | null {
  if (v.kind === 'supplier') return v.phase === 'toSite' ? v.targetId : null;
  if (v.phase !== 'toPickup' && v.phase !== 'toDropoff') return null;
  if (v.tourId !== null) return currentStop(state, v)?.siteId ?? null;
  return (v.phase === 'toPickup' ? v.job?.fromId : v.job?.toId) ?? null;
}
