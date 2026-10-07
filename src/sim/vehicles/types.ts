import type { ProductId } from '../../content/products';
import type { Cell } from '../world/roadLine';

/** Ladung eines Fahrzeugs. */
export interface Cargo {
  product: ProductId;
  quantity: number;
}

/** Gemeinsame Felder aller Fahrzeuge. Position: `route[0]` ist das aktuelle Feld. */
interface VehicleBase {
  id: number;
  route: Cell[];
  /** Fortschritt zum nächsten Feld in Tausendsteln. */
  progress: number;
  cargo: Cargo | null;
  /** Restschritte beim Ab-/Aufladen bzw. bis zum nächsten Versuch. */
  timer: number;
}

/** Zulieferer: bringt eingekaufte Rohware von außen zu einem Lieferort und fährt wieder hinaus. */
export interface Supplier extends VehicleBase {
  kind: 'supplier';
  phase: 'toSite' | 'handling' | 'toExit' | 'noRoute';
  /** Ziel-Lieferort. */
  targetId: number;
  /** Für die Lieferung bezahlter Betrag (Erstattung, wenn das Ziel wegfällt). */
  paidCents: number;
}

/** Transportauftrag eines LKW: Ware von Ort zu Ort. */
export interface Job {
  product: ProductId;
  fromId: number;
  toId: number;
  quantity: number;
}

/** Halt einer festen Tour (T1.5b). */
export interface TourStop {
  siteId: number;
  action: 'load' | 'unload';
  product: ProductId;
}

/** Warum ein LKW steht. Texte in ui/texts/de.ts. */
export type TruckIdleReason = 'noJob' | 'noRoute' | 'noDestination' | 'noTour';

/** Eigener LKW (T1.5): sucht sich in der Automatik selbst Aufträge oder fährt eine feste Tour. */
export interface Truck extends VehicleBase {
  kind: 'truck';
  phase: 'idle' | 'toPickup' | 'loading' | 'toDropoff' | 'unloading';
  job: Job | null;
  idleReason: TruckIdleReason | null;
  /** Gefahrene Tausendstel Felder, die noch nicht als Kilometerkosten gebucht sind. */
  odometer: number;
  mode: 'auto' | 'tour';
  tour: TourStop[];
  /** Nächster bzw. aktueller Halt der Tour. */
  tourIndex: number;
}

export type Vehicle = Supplier | Truck;
