import { zoneConfig } from '../../config/zones';
import { zoneTypes, type ZoneKind } from '../../content/zones';
import type { EventBus } from '../core/eventBus';
import type { GameState, Zone } from '../state/gameState';
import { SIDES, suggestGate, type Side } from '../world/access';
import { isInsideCampus, type Footprint } from '../world/grid';
import { buildOccupancy, isFree } from '../world/occupancy';
import type { Cell } from '../world/roadLine';
import { RoadNetwork } from '../world/roadNetwork';
import { shapeArea, shapeCenter, touchesShape, type Shape } from '../world/zoneShape';
import { bookBuild, demolishRefund, type BuildRejection } from './build';
import { mergeZones } from './zoneMerge';

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

/** Lagerplatz je Ware: die Gesamtfläche bestimmt die Kapazität. */
export function zoneCapacity(zone: Shape | Pick<Zone, 'parts'>): number {
  const shape = 'parts' in zone ? zone.parts : zone;
  return shapeArea(shape) * zoneConfig.capacityPerField;
}

/** Zonen gleicher Art, an die das Rechteck mit einer Kante grenzt (werden verschmolzen). */
export function neighboursOf(state: GameState, kind: ZoneKind, f: Footprint): Zone[] {
  return state.zones.filter((z) => z.kind === kind && touchesShape(z.parts, f));
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

/**
 * Zieht eine Zone auf. Grenzt sie an Zonen gleicher Art, wird alles zu einer Zone
 * (Rückmeldung Florian zu 0.2.0).
 */
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
  const f = check.footprint;
  const part = { ...f, builtTick: state.tick, paidCents: check.costCents };
  const neighbours = neighboursOf(state, kind, f);
  bookBuild(state, bus, -check.costCents, { x: f.x + f.width / 2, z: f.z + f.depth / 2 });
  if (neighbours.length > 0) {
    const zone = mergeZones(state, neighbours, part);
    bus.emit({ type: 'zone/placed', id: zone.id, kind, costCents: check.costCents });
    return check;
  }
  const id = state.nextId++;
  const stock = Object.fromEntries(zoneTypes[kind].stores.map((p) => [p, 0]));
  const side = gate ?? suggestGate(new RoadNetwork(state), f);
  state.zones.push({ id, kind, parts: [part], gate: side, stock, work: 0 });
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

/** Erstattung beim Abriss: jeder Teil nach seinem eigenen Bautag. */
export function zoneRefund(state: GameState, zone: Zone): number {
  return zone.parts.reduce((sum, p) => sum + demolishRefund(state, p.builtTick, p.paidCents), 0);
}

/** Reißt eine Zone ab; ihr Bestand geht verloren. */
export function demolishZone(state: GameState, bus: EventBus, id: number): number | null {
  const index = state.zones.findIndex((z) => z.id === id);
  const zone = state.zones[index];
  if (!zone) return null;
  const refund = zoneRefund(state, zone);
  state.zones.splice(index, 1);
  bookBuild(state, bus, refund, shapeCenter(zone.parts));
  bus.emit({ type: 'zone/demolished', id, refundCents: refund });
  return refund;
}
