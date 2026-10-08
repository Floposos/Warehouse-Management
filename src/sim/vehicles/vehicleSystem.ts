import type { EventBus } from '../core/eventBus';
import { isDayStart } from '../core/gameTime';
import type { GameState } from '../state/gameState';
import { Traffic } from '../traffic/traffic';
import { RoadNetwork } from '../world/roadNetwork';
import { updateLeases } from './fleet';
import { stepSupplier } from './suppliers';
import { bookTruckCosts, stepTruck } from './trucks';
import type { Vehicle } from './types';

/**
 * Alle Fahrzeuge eines Schritts in fester Reihenfolge (nach Id), mit gemeinsamer
 * Verkehrslage (T2.2): Zulieferer und eigene LKW teilen sich Spuren, Kreuzungen und
 * Stellplätze. Leasingraten bei Fälligkeit, am Tageswechsel die Fahrzeugkosten.
 */
export function updateVehicles(state: GameState, bus: EventBus): void {
  const traffic = new Traffic(new RoadNetwork(state), state);
  const ctx = { state, bus, traffic };
  const remaining: Vehicle[] = [];
  for (const v of state.vehicles) {
    if (v.kind === 'truck') stepTruck(ctx, v);
    else if (!stepSupplier(ctx, v)) continue;
    remaining.push(v);
  }
  state.vehicles = remaining;
  updateLeases(state, bus);
  if (isDayStart(state.tick)) bookTruckCosts(state, bus);
}
