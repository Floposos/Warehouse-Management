import { zoneConfig } from '../../config/zones';
import { zoneTypes, type ZoneKind } from '../../content/zones';
import type { EventBus } from '../core/eventBus';
import type { GameState, Zone } from '../state/gameState';
import { isInsideCampus, type Footprint } from '../world/grid';
import { buildOccupancy, isFree } from '../world/occupancy';
import { SIDES, suggestGate, type Side } from '../world/access';
import type { Cell } from '../world/roadLine';
import { RoadNetwork } from '../world/roadNetwork';
import { bookBuild, demolishRefund, type BuildRejection } from './build';

export type ZoneCheck =
  | { ok: true; footprint: Footprint; costCents: number }
  | { ok: false; reason: BuildRejection; footprint: Footprint; costCents: number };

/** Rechteck zwischen zwei Eckfeldern (beide enthalten), egal in welche Richtung gezogen. */
export function zoneRect(a: Cell, b: Cell): Footprint {
  const x = Math.min(a.x, b.x);
  const z = Math.min(a.z, b.z);
  return { x, z, width: Math.abs(a.x - b.x) + 1, depth: Math.abs(a.z - b.z) + 1 };
}

export function zoneCost(kind: ZoneKind, f: Footprint): number {
  return f.width * f.depth * zoneConfig.costPerFieldCents[kind];
}

/** Lagerplatz je Ware: Größe bestimmt die Kapazität. */
export function zoneCapacity(zone: Pick<Zone, 'width' | 'depth'>): number {
  return zone.width * zone.depth * zoneConfig.capacityPerField;
}

export function checkPlaceZone(state: GameState, kind: ZoneKind, from: Cell, to: Cell): ZoneCheck {
  const footprint = zoneRect(from, to);
  if (!(kind in zoneTypes)) return { ok: false, reason: 'unknownType', footprint, costCents: 0 };
  const costCents = zoneCost(kind, footprint);
  const fail = (reason: BuildRejection): ZoneCheck => ({ ok: false, reason, footprint, costCents });
  if (!isInsideCampus(footprint)) return fail('outOfBounds');
  if (footprint.width < zoneConfig.minSize || footprint.depth < zoneConfig.minSize) {
    return fail('tooSmall');
  }
  if (!isFree(buildOccupancy(state), footprint)) return fail('occupied');
  if (state.finance.balanceCents < costCents) return fail('insufficientFunds');
  return { ok: true, footprint, costCents };
}

export function placeZone(
  state: GameState,
  bus: EventBus,
  kind: ZoneKind,
  from: Cell,
  to: Cell,
  gate: Side | null = null,
): ZoneCheck {
  const check = checkPlaceZone(state, kind, from, to);
  if (!check.ok) return check;
  const id = state.nextId++;
  const stock = Object.fromEntries(zoneTypes[kind].stores.map((p) => [p, 0]));
  const f = check.footprint;
  const side = gate ?? suggestGate(new RoadNetwork(state), f);
  const paidCents = check.costCents;
  state.zones.push({
    id,
    kind,
    ...f,
    gate: side,
    builtTick: state.tick,
    paidCents,
    stock,
    work: 0,
  });
  bookBuild(state, bus, -check.costCents, { x: f.x + f.width / 2, z: f.z + f.depth / 2 });
  bus.emit({ type: 'zone/placed', id, kind, costCents: check.costCents });
  return check;
}

/** Wählt die Tor-Seite einer Zone (kostenlos). */
export function setZoneGate(state: GameState, id: number, gate: Side): boolean {
  const zone = state.zones.find((z) => z.id === id);
  if (!zone || !SIDES.includes(gate)) return false;
  zone.gate = gate;
  return true;
}

/** Reißt eine Zone ab; ihr Bestand geht verloren. */
export function demolishZone(state: GameState, bus: EventBus, id: number): number | null {
  const index = state.zones.findIndex((z) => z.id === id);
  const zone = state.zones[index];
  if (!zone) return null;
  const refund = demolishRefund(state, zone.builtTick, zone.paidCents);
  state.zones.splice(index, 1);
  bookBuild(state, bus, refund, { x: zone.x + zone.width / 2, z: zone.z + zone.depth / 2 });
  bus.emit({ type: 'zone/demolished', id, refundCents: refund });
  return refund;
}
