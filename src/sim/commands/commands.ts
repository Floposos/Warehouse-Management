import type { BuildingTypeId } from '../../content/buildings';
import type { EventBus } from '../core/eventBus';
import type { GameState } from '../state/gameState';
import { demolishBuilding, placeBuilding } from './build';

/**
 * Spieleraktionen als Befehle. Darstellung, UI und Eingabe ändern den Zustand nie direkt,
 * sondern reichen Befehle ein; die Simulation prüft und führt sie im nächsten Schritt aus.
 */
export type Command =
  /** Entwicklerbefehl (nicht in der Oberfläche): Kontostand ändern, z. B. für Tests. */
  | { type: 'finance/adjustBalance'; deltaCents: number }
  | { type: 'build/place'; buildingType: BuildingTypeId; x: number; z: number }
  | { type: 'build/demolish'; buildingId: number };

export type CommandResult = { ok: true } | { ok: false; reason: string };

/** Prüft und führt einen Befehl aus. Abgelehnte Befehle ändern nichts. */
export function executeCommand(state: GameState, command: Command, bus: EventBus): CommandResult {
  switch (command.type) {
    case 'finance/adjustBalance': {
      if (!Number.isSafeInteger(command.deltaCents)) {
        return reject(bus, command, 'Betrag muss ganzzahlig in Cent sein');
      }
      state.finance.balanceCents += command.deltaCents;
      bus.emit({
        type: 'finance/balanceChanged',
        balanceCents: state.finance.balanceCents,
        deltaCents: command.deltaCents,
      });
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
  }
}

function reject(bus: EventBus, command: Command, reason: string): CommandResult {
  bus.emit({ type: 'command/rejected', command: command.type, reason });
  return { ok: false, reason };
}
