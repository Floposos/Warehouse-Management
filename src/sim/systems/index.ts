import { calendarSystem } from './calendar';
import { ordersSystem, productionSystem, suppliersSystem, trucksSystem } from './goods';
import type { SimSystem } from './types';

/** Alle Systeme in fester Reihenfolge (wichtig für Determinismus). */
export const defaultSystems: readonly SimSystem[] = [
  calendarSystem,
  ordersSystem,
  suppliersSystem,
  trucksSystem,
  productionSystem,
];
