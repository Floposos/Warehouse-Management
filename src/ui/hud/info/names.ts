import type { GameState } from '../../../sim/state/gameState';
import { sites } from '../../../sim/world/sites';
import { de } from '../../texts/de';

/** Laufende Nummer unter Gleichartigen (nach Bau-Reihenfolge), ab 1. */
function numberAmong(ids: readonly number[], id: number): number {
  return [...ids].sort((a, b) => a - b).indexOf(id) + 1;
}

/** Anzeigename eines Orts oder Gebäudes, z. B. „Lieferort A 2“ oder „Export-Ausfahrt 1“. */
export function siteLabel(state: GameState, id: number): string {
  const zone = state.zones.find((z) => z.id === id);
  if (zone) {
    const same = state.zones.filter((z) => z.kind === zone.kind).map((z) => z.id);
    return de.info.siteName(de.build.zones[zone.kind], numberAmong(same, id));
  }
  const building = state.buildings.find((b) => b.id === id);
  if (!building) return de.info.none;
  const same = state.buildings.filter((b) => b.type === building.type).map((b) => b.id);
  return de.info.siteName(de.build.buildings[building.type], numberAmong(same, id));
}

/** z. B. „Transporter 2“ oder „LKW 1“, nummeriert je Fahrzeugtyp (T2.5). */
export function truckLabel(state: GameState, id: number): string {
  const truck = state.vehicles.find((v) => v.id === id);
  const model = truck?.kind === 'truck' ? truck.model : 'truck';
  const same = state.vehicles
    .filter((v) => v.kind === 'truck' && v.model === model)
    .map((v) => v.id);
  return de.info.siteName(de.fleet.models[model], numberAmong(same, id));
}

/** Alle anfahrbaren Orte mit Namen (für Auswahllisten). */
export function siteOptions(state: GameState): { id: number; label: string }[] {
  return sites(state)
    .filter((s) => s.kind !== 'W')
    .map((s) => ({ id: s.id, label: siteLabel(state, s.id) }));
}
