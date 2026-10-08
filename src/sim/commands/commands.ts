import type { BuildingTypeId } from '../../content/buildings';
import type { RawProductId } from '../../content/products';
import type { ZoneKind } from '../../content/zones';
import {
  vehicleDrives,
  vehicleModels,
  type VehicleDrive,
  type VehicleModel,
} from '../../content/vehicleTypes';
import type { EventBus } from '../core/eventBus';
import { book } from '../finance/ledger';
import { buyTruck } from '../vehicles/buyTruck';
import { disposeTruck } from '../vehicles/fleet';
import { assignTour } from '../vehicles/truckCommands';
import { createTour, deleteTour, updateTour, type TourPatch } from '../vehicles/tours';
import { cancelOrder, createOrder, type OrderInterval } from '../goods/orders';
import type { GameState } from '../state/gameState';
import { demolishBuilding, placeBuilding } from './build';
import { setPriority } from './priority';
import { buildRoad, demolishRoad } from './roads';
import type { Side } from '../world/access';
import { demolishZoneCell } from './zoneCells';
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
  /** Vorfahrtsstraße auf der gezogenen Strecke markieren bzw. Markierung entfernen (T2.2). */
  | {
      type: 'road/setPriority';
      fromX: number;
      fromZ: number;
      toX: number;
      toZ: number;
      xFirst: boolean;
      priority: boolean;
    }
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
  /** Einzelnes Feld einer Zone abreißen; die Zone kann dabei zerfallen. */
  | { type: 'zone/demolishCell'; zoneId: number; x: number; z: number }
  /** Rohware bestellen: einmalig (`once`) oder als Dauerauftrag. Erste Lieferung sofort. */
  | { type: 'order/create'; product: RawProductId; quantity: number; interval: OrderInterval }
  | { type: 'order/cancel'; orderId: number }
  | { type: 'vehicle/buyTruck' }
  /** Fahrzeug kaufen oder leasen (T2.5). */
  | { type: 'vehicle/buy'; model: VehicleModel; drive: VehicleDrive; lease: boolean }
  /** Verkaufen bzw. Leasing zurückgeben. */
  | { type: 'vehicle/dispose'; truckId: number }
  /** Tour zuweisen; null = Automatik. */
  | { type: 'vehicle/assignTour'; truckId: number; tourId: number | null }
  /** Touren (T2.1). Halte werden immer als Ganzes geschickt. Ergebnis enthält die neue Id. */
  | ({ type: 'tour/create' } & TourPatch)
  | ({ type: 'tour/update'; tourId: number } & TourPatch)
  | { type: 'tour/delete'; tourId: number };

/** Ergebnis; `id` ist bei Befehlen gesetzt, die etwas Neues anlegen. */
export type CommandResult = { ok: true; id?: number } | { ok: false; reason: string };

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
    case 'zone/demolishCell':
      return demolishZoneCell(state, bus, command.zoneId, command.x, command.z) === null
        ? reject(bus, command, 'notFound')
        : { ok: true };
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
    case 'vehicle/buy': {
      if (!vehicleModels.includes(command.model) || !vehicleDrives.includes(command.drive)) {
        return reject(bus, command, 'unknownType');
      }
      const result = buyTruck(state, bus, command.model, command.drive, command.lease === true);
      return typeof result === 'string'
        ? reject(bus, command, result)
        : { ok: true, id: result.id };
    }
    case 'vehicle/dispose':
      return disposeTruck(state, bus, command.truckId)
        ? { ok: true }
        : reject(bus, command, 'notFound');
    case 'vehicle/assignTour':
      return assignTour(state, command.truckId, command.tourId)
        ? { ok: true }
        : reject(bus, command, 'notFound');
    case 'tour/create': {
      const tour = createTour(state, command);
      return typeof tour === 'string' ? reject(bus, command, tour) : { ok: true, id: tour.id };
    }
    case 'tour/update': {
      const rejection = updateTour(state, command.tourId, command);
      return rejection ? reject(bus, command, rejection) : { ok: true };
    }
    case 'tour/delete':
      return deleteTour(state, command.tourId) ? { ok: true } : reject(bus, command, 'notFound');
    case 'road/setPriority': {
      const from = { x: command.fromX, z: command.fromZ };
      const to = { x: command.toX, z: command.toZ };
      const changed = setPriority(state, bus, from, to, command.xFirst, command.priority);
      return changed === null ? reject(bus, command, 'noRoad') : { ok: true };
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
