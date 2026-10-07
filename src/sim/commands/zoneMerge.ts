import type { GameState, Zone, ZonePart } from '../state/gameState';
import { shapeArea } from '../world/zoneShape';

/**
 * Verschmilzt angrenzende Zonen gleicher Art mit einem neuen Rechteck zu einer Zone.
 * ANNAHME (0.2.1): Nummer und Tor-Seite der größten bisherigen Zone bleiben; Bestand und
 * Verarbeitungsfortschritt werden zusammengezählt. Verweise (LKW-Aufträge, Tour-Halte,
 * Zulieferer-Ziele) zeigen danach auf die verschmolzene Zone.
 */
export function mergeZones(state: GameState, neighbours: Zone[], part: ZonePart): Zone {
  const keep = neighbours.reduce((a, b) =>
    shapeArea(b.parts) > shapeArea(a.parts) ||
    (shapeArea(b.parts) === shapeArea(a.parts) && b.id < a.id)
      ? b
      : a,
  );
  const others = neighbours.filter((z) => z !== keep);
  for (const other of others) {
    keep.parts.push(...other.parts);
    keep.work += other.work;
    for (const [product, n] of Object.entries(other.stock)) {
      const key = product as keyof Zone['stock'];
      keep.stock[key] = (keep.stock[key] ?? 0) + (n ?? 0);
    }
  }
  keep.parts.push(part);
  const removed = new Set(others.map((z) => z.id));
  state.zones = state.zones.filter((z) => !removed.has(z.id));
  const remap = (id: number): number => (removed.has(id) ? keep.id : id);
  for (const v of state.vehicles) {
    if (v.kind === 'supplier') {
      v.targetId = remap(v.targetId);
      continue;
    }
    if (v.job) {
      v.job.fromId = remap(v.job.fromId);
      v.job.toId = remap(v.job.toId);
    }
    for (const stop of v.tour) stop.siteId = remap(stop.siteId);
  }
  return keep;
}
