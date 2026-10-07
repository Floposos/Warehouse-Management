import type { BuildingTypeId } from '../../content/buildings';

/** Alle Ereignisse der Simulation. Neue Systeme ergänzen hier ihre Ereignistypen. */
export type SimEvent =
  | { type: 'time/dayStarted'; year: number; month: number; day: number }
  | { type: 'time/monthStarted'; year: number; month: number }
  | { type: 'time/yearStarted'; year: number }
  | { type: 'finance/balanceChanged'; balanceCents: number; deltaCents: number }
  | { type: 'command/rejected'; command: string; reason: string }
  | {
      type: 'build/placed';
      id: number;
      buildingType: BuildingTypeId;
      x: number;
      z: number;
      costCents: number;
    }
  | { type: 'build/demolished'; id: number; refundCents: number };

export type SimEventType = SimEvent['type'];
export type SimEventOf<T extends SimEventType> = Extract<SimEvent, { type: T }>;
