import type { EventBus } from '../core/eventBus';
import type { GameState } from '../state/gameState';

export interface SystemContext {
  bus: EventBus;
}

/** Ein Spielsystem: bearbeitet pro Schritt seinen Teil des Zustands. */
export interface SimSystem {
  id: string;
  update(state: GameState, ctx: SystemContext): void;
}
