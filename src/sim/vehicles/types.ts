import type { ProductId } from '../../content/products';
import type { VehicleDrive, VehicleModel } from '../../content/vehicleTypes';
import type { Heading } from '../traffic/lanes';
import type { Cell } from '../world/roadLine';

/** Ladung eines Fahrzeugs. */
export interface Cargo {
  product: ProductId;
  quantity: number;
}

/** Gemeinsame Felder aller Fahrzeuge. Position: `route[0]` ist das aktuelle Feld. */
export interface VehicleBase {
  id: number;
  route: Cell[];
  /** Fortschritt zum nächsten Feld in Tausendsteln. */
  progress: number;
  cargo: Cargo | null;
  /** Restschritte beim Ab-/Aufladen bzw. bis zum nächsten Versuch. */
  timer: number;
  /** Fahrtrichtung im aktuellen Feld (T2.2). */
  heading: Heading;
  /** Steht abseits der Fahrbahn (Stellplatz, geparkt) und belegt keine Spur. */
  offRoad: boolean;
  /** Belegter Stellplatz: Id des Orts, sonst null (T2.3). */
  bayAt: number | null;
  /** Schritte, die das Fahrzeug ohne Unterbrechung im Verkehr oder vor dem Tor wartet (T2.4). */
  waitTicks: number;
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

/** Tour als eigener Eintrag (T2.1): mehreren LKW zuweisbar, mit Farbe. */
export interface Tour {
  id: number;
  name: string;
  /** Index in `content/tourColors.ts`. */
  color: number;
  stops: TourStop[];
}

/** Leasingvertrag (T2.5): feste Laufzeit, Monatsrate, verlängert sich automatisch. */
export interface Lease {
  monthlyCents: number;
  /** Schritt der nächsten Rate. */
  nextPaymentTick: number;
  /** Ende der laufenden Laufzeit. */
  endTick: number;
}

/** Verschleiß, Wartung und Pannen eines eigenen Fahrzeugs (T2.6). */
export interface Upkeep {
  /** Zustand in Tausendstel Prozent (100.000 = neu). */
  condition: number;
  /** Gefahrene Tausendstel Feld, die noch nicht als Verschleiß zählen (< 1000). */
  wearRest: number;
  /** > 0: Panne, steht noch so viele Schritte. */
  brokenTicks: number;
  breakdowns: number;
  lastBreakdownTick: number | null;
  lastServiceTick: number | null;
  /** Spieler hat „Zur Werkstatt“ gewählt. */
  serviceRequested: boolean;
  /** Meldung „keine Werkstatt“ schon gegeben (bis zur nächsten Wartung). */
  warnedNoWorkshop: boolean;
  /** Ziel-Werkstatt während `toWorkshop`/`servicing`. */
  workshopId: number | null;
}

/** Warum ein LKW steht. Texte in ui/texts/de.ts. */
export type TruckIdleReason = 'noJob' | 'noRoute' | 'noDestination' | 'noTour';

/**
 * Eigener LKW (T1.5): sucht sich in der Automatik selbst Aufträge oder fährt eine feste Tour.
 * Seit T2.1 verweist er auf eine Tour (`tourId`); null = Automatik.
 */
export interface Truck extends VehicleBase {
  kind: 'truck';
  phase: TruckPhase;
  job: Job | null;
  idleReason: TruckIdleReason | null;
  /** Gefahrene Tausendstel Felder, die noch nicht als Kilometerkosten gebucht sind. */
  odometer: number;
  tourId: number | null;
  /** Nächster bzw. aktueller Halt der Tour. */
  tourIndex: number;
  /** Typ und Antrieb (T2.5). */
  model: VehicleModel;
  drive: VehicleDrive;
  /** Kaufpreis (bei Leasing der Listenpreis): Grundlage für Restwert und Rate. */
  priceCents: number;
  boughtTick: number;
  /** null = gekauft. */
  lease: Lease | null;
  upkeep: Upkeep;
}

export type TruckPhase =
  'idle' | 'toPickup' | 'loading' | 'toDropoff' | 'unloading' | 'toWorkshop' | 'servicing';

export type Vehicle = Supplier | Truck;

/** Startwerte der gemeinsamen Felder; neue Fahrzeuge fahren nach Osten (von der Einfahrt). */
export function vehicleBase(id: number, route: Cell[], offRoad: boolean): VehicleBase {
  return {
    id,
    route,
    progress: 0,
    cargo: null,
    timer: 1,
    heading: 1,
    offRoad,
    bayAt: null,
    waitTicks: 0,
  };
}
