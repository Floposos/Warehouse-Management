import type { BuildingTypeId } from '../../content/buildings';
import type { RawProductId } from '../../content/products';
import type { ZoneKind } from '../../content/zones';
import type { EventBus } from '../core/eventBus';
import { book } from '../finance/ledger';
import { buyTruck } from '../vehicles/buyTruck';
import { cancelOrder, createOrder, type OrderInterval } from '../goods/orders';
import type { GameState } from '../state/gameState';
import { demolishBuilding, placeBuilding } from './build';
import { buildRoad, demolishRoad } from './roads';
import type { Side } from '../world/access';
import { demolishZone, placeZone, setZoneGate } from './zones';

/**
 * Spieleraktionen als Befehle. Darstellung, UI und Eingabe ändern den Zustand nie direkt,
 * sondern reichen Befehle ein; die Simulation prüft und führt sie im nächsten Schritt aus.
 */
export type Command =
  /** Entwicklerbefehl (nicht in der Oberfläche): Kontostand ändern, z. B. für Tests. */
  | { type: 'finance/adjustBalance'; deltaCents: number }
  | { type: 'build/place'; buildingType: BuildingTypeId; x: number; z: number }
  | { type: 'build/demolish'; buildingId: number }
  /** Straße von (fromX, fromZ) nach (toX, toZ), gerade oder L-Form; `xFirst` = Knick-Richtung. */
  | { type: 'road/build'; fromX: number; fromZ: number; toX: number; toZ: number; xFirst: boolean }
  | { type: 'road/demolish'; x: number; z: number }
  /** Zone als Rechteck zwischen zwei Eckfeldern aufziehen. */
  /** Zone als Rechteck zwischen zwei Eckfeldern; ohne `gate` wird die Tor-Seite vorgeschlagen. */
  | {
      type: 'zone/place';
      kind: ZoneKind;
      fromX: number;
      fromZ: number;
      toX: number;
      toZ: number;
      gate?: Side;
    }
  | { type: 'zone/setGate'; zoneId: number; gate: Side }
  | { type: 'zone/demolish'; zoneId: number }
  /** Rohware bestellen: einmalig (`once`) oder als Dauerauftrag. Erste Lieferung sofort. */
  | { type: 'order/create'; product: RawProductId; quantity: number; interval: OrderInterval }
  | { type: 'order/cancel'; orderId: number }
  | { type: 'vehicle/buyTruck' };

export type CommandResult = { ok: true } | { ok: false; reason: string };

/** Prüft und führt einen Befehl aus. Abgelehnte Befehle ändern nichts. */
export function executeCommand(state: GameState, command: Command, bus: EventBus): CommandResult {
  switch (command.type) {
    case 'finance/adjustBalance': {
      if (!Number.isSafeInteger(command.deltaCents)) {
        return reject(bus, command, 'Betrag muss ganzzahlig in Cent sein');
      }
      // Entwicklerbefehl: als „Betrieb“ gebucht.
      book(state.finance, state.tick, bus, 'operations', command.deltaCents);
      return { ok: true };
    }
    case 'build/place': {
      const check = placeBuilding(state, bus, command.buildingType, command.x, command.z);
      return check.ok ? { ok: true } : reject(bus, command, check.reason);
    }
    case 'build/demolish': {
      const refund = demolishBuilding(state, bus, command.buildingId);
      return refund === null ? reject(bus, command, 'notFound') : { ok: true };
    }
    case 'road/build': {
      const from = { x: command.fromX, z: command.fromZ };
      const to = { x: command.toX, z: command.toZ };
      const check = buildRoad(state, bus, from, to, command.xFirst);
      return check.ok ? { ok: true } : reject(bus, command, check.reason);
    }
    case 'zone/place': {
      const from = { x: command.fromX, z: command.fromZ };
      const to = { x: command.toX, z: command.toZ };
      const check = placeZone(state, bus, command.kind, from, to, command.gate ?? null);
      return check.ok ? { ok: true } : reject(bus, command, check.reason);
    }
    case 'zone/setGate':
      return setZoneGate(state, command.zoneId, command.gate)
        ? { ok: true }
        : reject(bus, command, 'notFound');
    case 'zone/demolish': {
      const refund = demolishZone(state, bus, command.zoneId);
      return refund === null ? reject(bus, command, 'notFound') : { ok: true };
    }
    case 'order/create':
      return createOrder(state, command.product, command.quantity, command.interval)
        ? { ok: true }
        : reject(bus, command, 'invalidOrder');
    case 'order/cancel':
      return cancelOrder(state, command.orderId) ? { ok: true } : reject(bus, command, 'notFound');
    case 'vehicle/buyTruck': {
      const result = buyTruck(state, bus);
      return typeof result === 'string' ? reject(bus, command, result) : { ok: true };
    }
    case 'road/demolish': {
      const refund = demolishRoad(state, bus, command.x, command.z);
      return refund === null ? reject(bus, command, 'notFound') : { ok: true };
    }
  }
}

function reject(bus: EventBus, command: Command, reason: string): CommandResult {
  bus.emit({ type: 'command/rejected', command: command.type, reason });
  return { ok: false, reason };
}
