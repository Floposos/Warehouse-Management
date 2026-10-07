import { executeCommand, type Command, type CommandResult } from '../commands/commands';
import type { GameState } from '../state/gameState';
import { defaultSystems } from '../systems';
import type { SimSystem } from '../systems/types';
import { EventBus } from './eventBus';

/**
 * Hält den Spielzustand und rechnet ihn Schritt für Schritt weiter.
 * Ablauf je Schritt: eingereichte Befehle ausführen → Zähler erhöhen → Systeme in
 * fester Reihenfolge → gesammelte Ereignisse verteilen.
 */
export class Simulation {
  readonly bus = new EventBus();
  private queue: Command[] = [];

  constructor(
    public state: GameState,
    private readonly systems: readonly SimSystem[] = defaultSystems,
  ) {}

  /** Reicht einen Befehl ein; er wird im nächsten Schritt geprüft und ausgeführt. */
  submit(command: Command): void {
    this.queue.push(command);
  }

  /**
   * Führt einen Befehl sofort zwischen zwei Schritten aus (Spieleraktionen, auch in der Pause).
   * Gleichwertig zu `submit` + Ausführung am Anfang des nächsten Schritts, da Befehle dort
   * ebenfalls vor dem Hochzählen laufen; liefert das Ergebnis direkt für die Rückmeldung.
   */
  execute(command: Command): CommandResult {
    const result = executeCommand(this.state, command, this.bus);
    this.bus.flush();
    return result;
  }

  step(): void {
    const commands = this.queue;
    this.queue = [];
    for (const command of commands) executeCommand(this.state, command, this.bus);
    this.state.tick += 1;
    const ctx = { bus: this.bus };
    for (const system of this.systems) system.update(this.state, ctx);
    this.bus.flush();
  }

  run(ticks: number): void {
    for (let i = 0; i < ticks; i++) this.step();
  }

  /** Ersetzt den Zustand (Laden eines Spielstands); offene Befehle verfallen. */
  replaceState(state: GameState): void {
    this.state = state;
    this.queue = [];
  }
}
