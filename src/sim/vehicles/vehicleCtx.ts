import type { EventBus } from '../core/eventBus';
import type { GameState } from '../state/gameState';
import type { Traffic } from '../traffic/traffic';

/** Was die Fahrzeug-Logik je Schritt braucht. Das Straßennetz steckt in `traffic.network`. */
export interface VehicleCtx {
  state: GameState;
  bus: EventBus;
  traffic: Traffic;
}
