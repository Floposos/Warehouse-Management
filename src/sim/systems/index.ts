import { calendarSystem } from './calendar';
import { ordersSystem, productionSystem, vehiclesSystem } from './goods';
import type { SimSystem } from './types';

/** Alle Systeme in fester Reihenfolge (wichtig für Determinismus). */
export const defaultSystems: readonly SimSystem[] = [
  calendarSystem,
  ordersSystem,
  vehiclesSystem,
  productionSystem,
];
