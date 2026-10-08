import { updateOrders } from '../goods/orders';
import { updateProduction } from '../production/production';
import { updateVehicles } from '../vehicles/vehicleSystem';
import type { SimSystem } from './types';

export const ordersSystem: SimSystem = {
  id: 'orders',
  update: (state, { bus }) => updateOrders(state, bus),
};

/** Zulieferer und eigene LKW mit gemeinsamem Verkehr (seit T2.2 ein System). */
export const vehiclesSystem: SimSystem = {
  id: 'vehicles',
  update: (state, { bus }) => updateVehicles(state, bus),
};

export const productionSystem: SimSystem = {
  id: 'production',
  update: (state, { bus }) => updateProduction(state, bus),
};
