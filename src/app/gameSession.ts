import type { GameSpeed } from '../config/time';
import type { Command, CommandResult } from '../sim/commands/commands';
import { Simulation } from '../sim/core/simulation';
import { StepClock } from '../sim/core/stepClock';
import type { GameState } from '../sim/state/gameState';

/** Laufendes Spiel: Simulation, Takt und Geschwindigkeit (0 = Pause). */
export class GameSession {
  readonly sim: Simulation;
  private readonly clock = new StepClock();
  private speedValue: GameSpeed | 0 = 1;
  /** Letzte Geschwindigkeit vor der Pause, für „Weiter“. */
  private resumeSpeed: GameSpeed = 1;
  private readonly speedListeners: ((speed: GameSpeed | 0) => void)[] = [];

  constructor(state: GameState) {
    this.sim = new Simulation(state);
  }

  get state(): GameState {
    return this.sim.state;
  }

  get speed(): GameSpeed | 0 {
    return this.speedValue;
  }

  get paused(): boolean {
    return this.speedValue === 0;
  }

  /** Spieleraktion sofort ausführen (wirkt auch in der Pause). */
  command(command: Command): CommandResult {
    return this.sim.execute(command);
  }

  setSpeed(speed: GameSpeed | 0): void {
    if (speed !== 0) this.resumeSpeed = speed;
    if (speed === this.speedValue) return;
    this.speedValue = speed;
    for (const listener of this.speedListeners) listener(speed);
  }

  pause(): void {
    this.setSpeed(0);
  }

  resume(): void {
    this.setSpeed(this.resumeSpeed);
  }

  togglePause(): void {
    if (this.paused) this.resume();
    else this.pause();
  }

  onSpeedChange(listener: (speed: GameSpeed | 0) => void): void {
    this.speedListeners.push(listener);
  }

  /** Pro Bild: rechnet die fälligen Schritte. Liefert Anzahl und Rechenzeit (für F3). */
  frame(dtMs: number): { ticks: number; simMs: number } {
    const ticks = this.clock.advance(dtMs, this.speedValue);
    const start = performance.now();
    this.sim.run(ticks);
    return { ticks, simMs: performance.now() - start };
  }

  /** Ersetzt den Zustand (Laden); Takt-Rest verfällt. */
  load(state: GameState): void {
    this.sim.replaceState(state);
    this.clock.reset();
  }
}
