import { updateOrders } from '../goods/orders';
import { updateProduction } from '../production/production';
import { updateSuppliers } from '../vehicles/suppliers';
import type { SimSystem } from './types';

export const ordersSystem: SimSystem = {
  id: 'orders',
  update: (state, { bus }) => updateOrders(state, bus),
};

export const suppliersSystem: SimSystem = {
  id: 'suppliers',
  update: (state, { bus }) => updateSuppliers(state, bus),
};

export const productionSystem: SimSystem = {
  id: 'production',
  update: (state, { bus }) => updateProduction(state, bus),
};
