import type { EventBus } from '../core/eventBus';
import type { GameState, RoadTile } from '../state/gameState';
import { roadLine, type Cell } from '../world/roadLine';

/** Straßenfelder auf der gezogenen Strecke (andere Felder werden übersprungen). */
export function priorityTiles(state: GameState, from: Cell, to: Cell, xFirst: boolean): RoadTile[] {
  const byKey = new Map(state.roads.map((r) => [`${r.x},${r.z}`, r]));
  return roadLine(from, to, xFirst).flatMap((c) => byKey.get(`${c.x},${c.z}`) ?? []);
}

/**
 * Vorfahrtsstraße markieren bzw. die Markierung entfernen (T2.2, Entscheidung 08.10.2026).
 * ANNAHME: kostenlos. Liefert die Zahl der geänderten Felder; null = keine Straße auf der Strecke.
 */
export function setPriority(
  state: GameState,
  bus: EventBus,
  from: Cell,
  to: Cell,
  xFirst: boolean,
  priority: boolean,
): number | null {
  const tiles = priorityTiles(state, from, to, xFirst);
  if (tiles.length === 0) return null;
  const changed = tiles.filter((t) => t.priority !== priority);
  for (const t of changed) t.priority = priority;
  if (changed.length > 0) {
    bus.emit({
      type: 'road/priorityChanged',
      cells: changed.map((t) => ({ x: t.x, z: t.z })),
      priority,
    });
  }
  return changed.length;
}
