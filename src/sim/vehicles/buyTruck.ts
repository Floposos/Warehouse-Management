import type { VehicleDrive, VehicleModel } from '../../content/vehicleTypes';
import type { EventBus } from '../core/eventBus';
import { book } from '../finance/ledger';
import type { GameState } from '../state/gameState';
import { ENTRANCE } from '../world/roadNetwork';
import { acquisitionCents, modelValues, newLease } from './fleet';
import { vehicleBase, type Truck } from './types';
import { newUpkeep } from './upkeep';

/**
 * Kauft oder least ein Fahrzeug (T2.5); es erscheint an der Einfahrt und startet in der
 * Automatik. Kauf: voller Preis; Leasing: erste Monatsrate sofort.
 */
export function buyTruck(
  state: GameState,
  bus: EventBus,
  model: VehicleModel = 'truck',
  drive: VehicleDrive = 'diesel',
  lease = false,
): Truck | 'insufficientFunds' {
  const cost = acquisitionCents(model, drive, lease);
  if (state.finance.balanceCents < cost) return 'insufficientFunds';
  const priceCents = modelValues(model, drive).priceCents;
  const truck: Truck = {
    ...vehicleBase(state.nextId++, [{ ...ENTRANCE }], true),
    kind: 'truck',
    phase: 'idle',
    job: null,
    idleReason: null,
    odometer: 0,
    tourId: null,
    tourIndex: 0,
    model,
    drive,
    priceCents,
    boughtTick: state.tick,
    lease: lease ? newLease(state, priceCents) : null,
    upkeep: newUpkeep(),
  };
  state.vehicles.push(truck);
  book(state.finance, state.tick, bus, 'vehicles', -cost, {
    x: ENTRANCE.x + 1,
    z: ENTRANCE.z + 0.5,
  });
  bus.emit({ type: 'vehicle/bought', id: truck.id });
  return truck;
}
