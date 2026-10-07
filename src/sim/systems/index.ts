import { calendarSystem } from './calendar';
import type { SimSystem } from './types';

/** Alle Systeme in fester Reihenfolge (wichtig für Determinismus). */
export const defaultSystems: readonly SimSystem[] = [calendarSystem];
