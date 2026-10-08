import type { BuildingTypeId } from '../../content/buildings';
import type { ProductId } from '../../content/products';
import type { ZoneKind } from '../../content/zones';
import type { Notice } from '../events/notices';
import type { BookingCategory, BookingPlace } from '../finance/ledger';

/** Alle Ereignisse der Simulation. Neue Systeme ergänzen hier ihre Ereignistypen. */
export type SimEvent =
  | { type: 'time/dayStarted'; year: number; month: number; day: number }
  | { type: 'time/monthStarted'; year: number; month: number }
  | { type: 'time/yearStarted'; year: number }
  | { type: 'finance/balanceChanged'; balanceCents: number; deltaCents: number }
  | {
      type: 'finance/booked';
      category: BookingCategory;
      amountCents: number;
      at: BookingPlace | null;
    }
  | { type: 'command/rejected'; command: string; reason: string }
  | {
      type: 'build/placed';
      id: number;
      buildingType: BuildingTypeId;
      x: number;
      z: number;
      costCents: number;
    }
  | { type: 'build/demolished'; id: number; refundCents: number }
  | { type: 'zone/placed'; id: number; kind: ZoneKind; costCents: number }
  | { type: 'zone/demolished'; id: number; refundCents: number }
  | { type: 'zone/cellDemolished'; id: number; x: number; z: number; refundCents: number }
  | { type: 'goods/delivered'; zoneId: number; product: ProductId; quantity: number }
  | { type: 'goods/produced'; zoneId: number; product: ProductId }
  | {
      type: 'goods/sold';
      exitId: number;
      product: ProductId;
      quantity: number;
      revenueCents: number;
    }
  | { type: 'vehicle/bought'; id: number }
  /** Verkauft bzw. Leasing zurückgegeben (Betrag: + Erlös, − Strafe). */
  | { type: 'vehicle/disposed'; id: number; amountCents: number }
  /** Fahrzeug steht seit `jamWarnTicks` im Stau (T2.4). */
  | { type: 'traffic/jam'; vehicleId: number; x: number; z: number }
  /** Neue Meldung in der Liste (T2.4/T2.6). */
  | { type: 'notice/added'; notice: Notice }
  | { type: 'road/built'; cells: { x: number; z: number }[]; costCents: number }
  | { type: 'road/demolished'; x: number; z: number; refundCents: number }
  | { type: 'road/priorityChanged'; cells: { x: number; z: number }[]; priority: boolean };

export type SimEventType = SimEvent['type'];
export type SimEventOf<T extends SimEventType> = Extract<SimEvent, { type: T }>;
