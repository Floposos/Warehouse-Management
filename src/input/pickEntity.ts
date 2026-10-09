import type { GameState } from '../sim/state/gameState';
import { buildingFootprint } from '../sim/world/occupancy';

/** Was der Spieler angeklickt hat. */
export interface Selection {
  kind: 'zone' | 'building' | 'vehicle';
  id: number;
}

/** Wie nah (in Feldern) ein Klick am Fahrzeug liegen muss. */
const VEHICLE_RADIUS = 0.8;

/** Fahrzeugmitte zwischen aktuellem und nächstem Feld (ohne Zwischenbild-Gleiten). */
function vehicleCenter(route: readonly { x: number; z: number }[], progress: number) {
  const a = route[0];
  if (!a) return null;
  const b = route[1] ?? a;
  const t = progress / 1000;
  return { x: a.x + 0.5 + (b.x - a.x) * t, z: a.z + 0.5 + (b.z - a.z) * t };
}

const inside = (f: { x: number; z: number; width: number; depth: number }, x: number, z: number) =>
  x >= f.x && x < f.x + f.width && z >= f.z && z < f.z + f.depth;

/** Objekt an einem Bodenpunkt: Fahrzeuge zuerst (stehen auf Straßen und Toren), dann Gebäude, dann Zonen. */
export function pickEntity(state: GameState, x: number, z: number): Selection | null {
  let best: { id: number; d: number } | null = null;
  for (const v of state.vehicles) {
    const c = vehicleCenter(v.route, v.progress);
    if (!c) continue;
    const d = Math.hypot(c.x - x, c.z - z);
    if (d <= VEHICLE_RADIUS && (!best || d < best.d)) best = { id: v.id, d };
  }
  if (best) return { kind: 'vehicle', id: best.id };
  const building = state.buildings.find((b) => inside(buildingFootprint(b), x, z));
  if (building) return { kind: 'building', id: building.id };
  const zone = state.zones.find((zn) => zn.parts.some((p) => inside(p, x, z)));
  return zone ? { kind: 'zone', id: zone.id } : null;
}
