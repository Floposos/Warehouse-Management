import { maintenanceConfig as mc } from '../../../config/maintenance';
import type { GameState } from '../../../sim/state/gameState';
import type { Truck } from '../../../sim/vehicles/types';
import { needsService } from '../../../sim/vehicles/upkeep';
import { de } from '../../texts/de';
import { truckLabel } from '../info/names';
import { truckStatus } from '../info/vehicleInfo';

export const FLEET_FILTERS = ['all', 'van', 'truck', 'service', 'broken', 'idle'] as const;
export type FleetFilter = (typeof FLEET_FILTERS)[number];
export const FLEET_SORTS = ['name', 'condition', 'status', 'tour'] as const;
export type FleetSort = (typeof FLEET_SORTS)[number];

/** Eine Zeile im Flottenfenster (T2.8). */
export interface FleetRow {
  id: number;
  name: string;
  type: string;
  status: string;
  tour: string;
  /** Zustand in ganzen Prozent. */
  condition: number;
  warning: boolean;
}

function matches(t: Truck, filter: FleetFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'van':
    case 'truck':
      return t.model === filter;
    case 'service':
      return needsService(t) || t.phase === 'toWorkshop' || t.phase === 'servicing';
    case 'broken':
      return t.upkeep.brokenTicks > 0;
    case 'idle':
      return t.phase === 'idle';
  }
}

/** Eigene Fahrzeuge gefiltert und sortiert; bei Gleichstand nach Name. */
export function fleetRows(state: GameState, filter: FleetFilter, sort: FleetSort): FleetRow[] {
  const rows: FleetRow[] = [];
  for (const t of state.vehicles) {
    if (t.kind !== 'truck' || !matches(t, filter)) continue;
    const tour = t.tourId === null ? null : state.tours.find((x) => x.id === t.tourId);
    rows.push({
      id: t.id,
      name: truckLabel(state, t.id),
      type: de.fleet.itemName(de.fleet.models[t.model], de.fleet.drives[t.drive]),
      status: truckStatus(t),
      tour: tour?.name ?? de.tours.auto,
      condition: Math.floor((t.upkeep.condition * 100) / mc.fullCondition),
      warning: t.upkeep.brokenTicks > 0 || t.upkeep.condition < mc.serviceBelow,
    });
  }
  const byName = (a: FleetRow, b: FleetRow): number =>
    a.name.localeCompare(b.name, 'de', { numeric: true });
  const compare: Record<FleetSort, (a: FleetRow, b: FleetRow) => number> = {
    name: byName,
    condition: (a, b) => a.condition - b.condition || byName(a, b),
    status: (a, b) => a.status.localeCompare(b.status, 'de') || byName(a, b),
    tour: (a, b) => a.tour.localeCompare(b.tour, 'de', { numeric: true }) || byName(a, b),
  };
  return rows.sort(compare[sort]);
}
