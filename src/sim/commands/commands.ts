import type { EventBus } from '../core/eventBus';
import type { GameState } from '../state/gameState';

/**
 * Spieleraktionen als Befehle. Darstellung, UI und Eingabe ändern den Zustand nie direkt,
 * sondern reichen Befehle ein; die Simulation prüft und führt sie im nächsten Schritt aus.
 * M1 ergänzt Bauen, Abreißen, Kaufen usw.
 */
export type Command =
  /** Entwicklerbefehl (nicht in der Oberfläche): Kontostand ändern, z. B. für Tests. */
  { type: 'finance/adjustBalance'; deltaCents: number };

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
  }
}

function reject(bus: EventBus, command: Command, reason: string): CommandResult {
  bus.emit({ type: 'command/rejected', command: command.type, reason });
  return { ok: false, reason };
}
