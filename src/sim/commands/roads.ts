import { buildConfig } from '../../config/build';
import type { EventBus } from '../core/eventBus';
import type { GameState } from '../state/gameState';
import { GRID_DEPTH, GRID_WIDTH } from '../world/grid';
import { buildOccupancy, ROAD_CELL } from '../world/occupancy';
import { roadLine, type Cell } from '../world/roadLine';
import { bookBuild, demolishRefund, type BuildRejection } from './build';

export type RoadCheck =
  | { ok: true; newCells: Cell[]; costCents: number }
  | { ok: false; reason: BuildRejection; newCells: Cell[]; costCents: number; blocked: Cell[] };

/**
 * Prüft eine gezogene Straße. Vorhandene Straßenfelder werden übernommen und kosten nichts;
 * liegt ein Feld außerhalb oder auf einem Gebäude, wird die ganze Straße abgelehnt.
 */
export function checkBuildRoad(state: GameState, from: Cell, to: Cell, xFirst: boolean): RoadCheck {
  const cells = roadLine(from, to, xFirst);
  const grid = buildOccupancy(state);
  const newCells: Cell[] = [];
  const outside: Cell[] = [];
  const occupied: Cell[] = [];
  for (const c of cells) {
    if (!Number.isInteger(c.x) || !Number.isInteger(c.z)) outside.push(c);
    else if (c.x < 0 || c.z < 0 || c.x >= GRID_WIDTH || c.z >= GRID_DEPTH) outside.push(c);
    else {
      const occupant = grid[c.z * GRID_WIDTH + c.x];
      if (occupant === 0) newCells.push(c);
      else if (occupant !== ROAD_CELL) occupied.push(c);
    }
  }
  const costCents = newCells.length * buildConfig.roadCostPerTileCents;
  if (outside.length > 0) {
    return { ok: false, reason: 'outOfBounds', newCells, costCents, blocked: outside };
  }
  if (occupied.length > 0) {
    return { ok: false, reason: 'occupied', newCells, costCents, blocked: occupied };
  }
  if (state.finance.balanceCents < costCents) {
    return { ok: false, reason: 'insufficientFunds', newCells, costCents, blocked: [] };
  }
  return { ok: true, newCells, costCents };
}

export function buildRoad(
  state: GameState,
  bus: EventBus,
  from: Cell,
  to: Cell,
  xFirst: boolean,
): RoadCheck {
  const check = checkBuildRoad(state, from, to, xFirst);
  if (!check.ok || check.newCells.length === 0) return check;
  const paid = buildConfig.roadCostPerTileCents;
  for (const c of check.newCells) {
    state.roads.push({ x: c.x, z: c.z, builtTick: state.tick, paidCents: paid });
  }
  const mid = check.newCells[Math.floor(check.newCells.length / 2)] ?? from;
  bookBuild(state, bus, -check.costCents, { x: mid.x + 0.5, z: mid.z + 0.5 });
  bus.emit({ type: 'road/built', cells: check.newCells, costCents: check.costCents });
  return check;
}

/** Erstattung für das Straßenfeld (x, z) oder null, wenn dort keine Straße ist. */
export function roadRefundAt(state: GameState, x: number, z: number): number | null {
  const tile = state.roads.find((r) => r.x === x && r.z === z);
  return tile ? demolishRefund(state, tile.builtTick, tile.paidCents) : null;
}

export function demolishRoad(state: GameState, bus: EventBus, x: number, z: number): number | null {
  const index = state.roads.findIndex((r) => r.x === x && r.z === z);
  const tile = state.roads[index];
  if (!tile) return null;
  const refund = demolishRefund(state, tile.builtTick, tile.paidCents);
  state.roads.splice(index, 1);
  bookBuild(state, bus, refund, { x: x + 0.5, z: z + 0.5 });
  bus.emit({ type: 'road/demolished', x, z, refundCents: refund });
  return refund;
}
