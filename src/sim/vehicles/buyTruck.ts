import { vehicleConfig } from '../../config/vehicles';
import type { EventBus } from '../core/eventBus';
import { book } from '../finance/ledger';
import type { GameState } from '../state/gameState';
import { ENTRANCE } from '../world/roadNetwork';
import { vehicleBase, type Truck } from './types';

/** Kauft einen LKW; er erscheint an der Einfahrt und startet in der Automatik. */
export function buyTruck(state: GameState, bus: EventBus): Truck | 'insufficientFunds' {
  if (state.finance.balanceCents < vehicleConfig.truckPriceCents) return 'insufficientFunds';
  const truck: Truck = {
    ...vehicleBase(state.nextId++, [{ ...ENTRANCE }], true),
    kind: 'truck',
    phase: 'idle',
    job: null,
    idleReason: null,
    odometer: 0,
    tourId: null,
    tourIndex: 0,
  };
  state.vehicles.push(truck);
  book(state.finance, state.tick, bus, 'vehicles', -vehicleConfig.truckPriceCents, {
    x: ENTRANCE.x + 1,
    z: ENTRANCE.z + 0.5,
  });
  bus.emit({ type: 'vehicle/bought', id: truck.id });
  return truck;
}
