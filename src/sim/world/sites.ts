import { buildingTypes } from '../../content/buildings';
import type { ZoneKind } from '../../content/zones';
import type { Building, GameState } from '../state/gameState';
import { accessCell, type Side } from './access';
import { GRID_WIDTH, type Footprint } from './grid';
import { buildingFootprint } from './occupancy';
import type { Cell } from './roadLine';
import type { RoadNetwork } from './roadNetwork';

/** Ein Ort, den LKW anfahren: Zone A/B/C oder die Export-Ausfahrt. */
export interface Site {
  id: number;
  kind: ZoneKind | 'export';
  /** Fläche: Rechtecke der Zone bzw. die Grundfläche der Ausfahrt. */
  parts: Footprint[];
  gate: Side;
}

/** Tor der Export-Ausfahrt: die Seite zum Gelände hin (sie steht am Rand). */
export function exitGate(f: Footprint): Side {
  if (f.x === 0) return 'E';
  if (f.x + f.width === GRID_WIDTH) return 'W';
  return f.z === 0 ? 'S' : 'N';
}

function exportSite(b: Building): Site {
  const footprint = buildingFootprint(b);
  return { id: b.id, kind: 'export', parts: [footprint], gate: exitGate(footprint) };
}

/** Alle anfahrbaren Orte in fester Reihenfolge (Zonen, dann Ausfahrten). */
export function sites(state: GameState): Site[] {
  const zones = state.zones.map((z) => ({
    id: z.id,
    kind: z.kind,
    parts: z.parts.map(({ x, z: pz, width, depth }) => ({ x, z: pz, width, depth })),
    gate: z.gate,
  }));
  const exits = state.buildings.filter((b) => 'needsAccess' in buildingTypes[b.type]);
  return [...zones, ...exits.map(exportSite)];
}

export function siteAccess(network: RoadNetwork, site: Site): Cell | null {
  return accessCell(network, site.parts, site.gate);
}
