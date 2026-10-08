import { zoneConfig } from '../../config/zones';
import type { EventBus } from '../core/eventBus';
import type { GameState, Zone, ZonePart } from '../state/gameState';
import { shapeArea, shapeContains, sharesEdge } from '../world/zoneShape';
import { bookBuild, demolishRefund } from './build';

/** Teilt einen Teil um ein Feld herum in bis zu vier Rechtecke; Preis anteilig nach Fläche. */
function cutCell(part: ZonePart, x: number, z: number): { rest: ZonePart[]; cellPaid: number } {
  const rects = [
    { x: part.x, z: part.z, width: part.width, depth: z - part.z },
    { x: part.x, z: z + 1, width: part.width, depth: part.z + part.depth - z - 1 },
    { x: part.x, z, width: x - part.x, depth: 1 },
    { x: x + 1, z, width: part.x + part.width - x - 1, depth: 1 },
  ].filter((r) => r.width > 0 && r.depth > 0);
  const area = part.width * part.depth;
  const rest = rects.map((r) => ({
    ...r,
    builtTick: part.builtTick,
    paidCents: Math.floor((part.paidCents * r.width * r.depth) / area),
  }));
  const cellPaid = part.paidCents - rest.reduce((n, p) => n + p.paidCents, 0);
  return { rest, cellPaid };
}

/** Zusammenhängende Gruppen von Teilen (Nachbarn über eine Kante). */
function components(parts: ZonePart[]): ZonePart[][] {
  const groups: ZonePart[][] = [];
  const seen = new Set<ZonePart>();
  for (const start of parts) {
    if (seen.has(start)) continue;
    const group = [start];
    seen.add(start);
    for (let i = 0; i < group.length; i++) {
      for (const p of parts) {
        const current = group[i];
        if (!seen.has(p) && current && sharesEdge(current, p)) {
          seen.add(p);
          group.push(p);
        }
      }
    }
    groups.push(group);
  }
  return groups.sort((a, b) => shapeArea(b) - shapeArea(a));
}

/**
 * Teilt die Zone nach dem Abriss auf, falls sie zerfallen ist.
 * ANNAHME (08.10.2026): Das größte Stück behält Nummer, Tor-Seite und den laufenden
 * Verarbeitungsfortschritt; neue Stücke bekommen dieselbe Tor-Seite. Der Bestand wird nach
 * Fläche aufgeteilt; was über das neue Lager hinausgeht, geht verloren.
 */
function splitZone(state: GameState, zone: Zone): void {
  const groups = components(zone.parts);
  const total = shapeArea(zone.parts);
  const stock = { ...zone.stock };
  const pieces: Zone[] = groups.map((parts, i) => {
    const piece = i === 0 ? zone : { ...zone, id: state.nextId++, work: 0, stock: {} };
    piece.parts = parts;
    return piece;
  });
  for (const piece of pieces) piece.stock = {};
  for (const [product, amount] of Object.entries(stock)) {
    const key = product as keyof Zone['stock'];
    let left = amount ?? 0;
    pieces.forEach((piece, i) => {
      const share =
        i === pieces.length - 1
          ? left
          : Math.floor(((amount ?? 0) * shapeArea(piece.parts)) / total);
      const cap = shapeArea(piece.parts) * zoneConfig.capacityPerField;
      piece.stock[key] = Math.min(cap, share);
      left -= share;
    });
  }
  state.zones.push(...pieces.slice(1));
}

/** Erstattung, die der Abriss dieses Felds bringen würde (für die Vorschau); null = kein Feld der Zone. */
export function zoneCellRefund(state: GameState, zone: Zone, x: number, z: number): number | null {
  const part = zone.parts.find((p) => shapeContains(p, x, z));
  return part ? demolishRefund(state, part.builtTick, cutCell(part, x, z).cellPaid) : null;
}

/** Reißt ein einzelnes Feld einer Zone ab. Liefert die Erstattung oder null. */
export function demolishZoneCell(
  state: GameState,
  bus: EventBus,
  zoneId: number,
  x: number,
  z: number,
): number | null {
  const zone = state.zones.find((zn) => zn.id === zoneId);
  if (!zone || !shapeContains(zone.parts, x, z)) return null;
  const part = zone.parts.find((p) => shapeContains(p, x, z));
  if (!part) return null;
  const { rest, cellPaid } = cutCell(part, x, z);
  zone.parts = zone.parts.flatMap((p) => (p === part ? rest : [p]));
  const refund = demolishRefund(state, part.builtTick, cellPaid);
  bookBuild(state, bus, refund, { x: x + 0.5, z: z + 0.5 });
  if (zone.parts.length === 0) {
    state.zones = state.zones.filter((zn) => zn !== zone);
    bus.emit({ type: 'zone/demolished', id: zoneId, refundCents: refund });
    return refund;
  }
  splitZone(state, zone);
  bus.emit({ type: 'zone/cellDemolished', id: zoneId, x, z, refundCents: refund });
  return refund;
}
