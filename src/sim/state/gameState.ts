import { economyConfig } from '../../config/economy';
import type { BuildingTypeId } from '../../content/buildings';
import type { ProductId, RawProductId } from '../../content/products';
import type { ZoneKind } from '../../content/zones';
import { createRngState, type RngState } from '../core/rng';
import { createFinance, type Finance } from '../finance/ledger';
import type { OrderBlock, OrderInterval } from '../goods/orders';
import type { Side } from '../world/access';
import type { Footprint } from '../world/grid';
import type { Notice } from '../events/notices';
import type { Tour, Vehicle } from '../vehicles/types';

/** Ein Gebäude auf dem Raster. `x`/`z` = Feld der linken oberen Ecke. */
export interface Building {
  id: number;
  type: BuildingTypeId;
  x: number;
  z: number;
  /** Schritt, in dem gebaut wurde (für die Abriss-Erstattung am selben Spieltag). */
  builtTick: number;
  /** Bezahlter Baupreis in Cent (Grundlage der Erstattung). */
  paidCents: number;
}

/** Ein Straßenfeld (1 Feld = Straßenbreite). Verbindungsstücke ergeben sich aus den Nachbarn. */
export interface RoadTile {
  x: number;
  z: number;
  builtTick: number;
  paidCents: number;
  /** Als Vorfahrtsstraße markiert (T2.2). */
  priority: boolean;
}

/** Frei aufgezogene Zone (Lieferort A, B oder C) mit Lager. `x`/`z` = linke obere Ecke. */
/** Ein Rechteck einer Zone mit eigenem Bautag und Preis (für die Erstattung beim Abriss). */
export interface ZonePart extends Footprint {
  builtTick: number;
  paidCents: number;
}

export interface Zone {
  id: number;
  kind: ZoneKind;
  /** Fläche: ein Rechteck oder mehrere angrenzende (verschmolzen, seit 0.2.1). */
  parts: ZonePart[];
  /** Tor-Seite, über die LKW ein- und ausfahren. */
  gate: Side;
  /** Bestand je Ware in Einheiten (nur Waren, die die Zone lagert). */
  stock: Partial<Record<ProductId, number>>;
  /** Fortschritt der laufenden Verarbeitung in Schritten (B und C). */
  work: number;
}

/** Rohware-Bestellung: einmalig oder als Dauerauftrag. */
export interface Order {
  id: number;
  product: RawProductId;
  quantity: number;
  interval: OrderInterval;
  /** Schritt der nächsten Lieferung. */
  nextTick: number;
  /** Warum die fällige Lieferung wartet (null = alles in Ordnung). */
  blocked: OrderBlock | null;
}

/**
 * Der komplette Spielzustand: nur JSON-fähige Werte, Tabellen nach ID geordnet,
 * Verweise nur über IDs. Speichern = diesen Zustand serialisieren.
 */
export interface GameState {
  /** Seed, mit dem das Spiel begonnen hat (nur Info; der Lauf-Zustand steht in `rng`). */
  seed: number;
  /** Anzahl ausgeführter Simulationsschritte seit Spielbeginn. */
  tick: number;
  rng: RngState;
  /** Eigener Zufallsstrom für Ereignisse wie Pannen (T2.6), damit sie andere Zufälle nicht verschieben. */
  eventRng: RngState;
  /** Nächste freie ID für neue Objekte. */
  nextId: number;
  finance: Finance;
  buildings: Building[];
  roads: RoadTile[];
  zones: Zone[];
  orders: Order[];
  vehicles: Vehicle[];
  /** Feste Touren (T2.1). */
  tours: Tour[];
  /** Meldungen (Stau, Pannen …), älteste zuerst (T2.4/T2.6). */
  notices: Notice[];
}

/** Lage der Test-Halle aus M0 (nahe der Eingangsstraße, Mitte der Westseite). */
const TEST_HALL = { x: 12, z: 58 } as const;

/** Startwert des Ereignis-Zufallsstroms, aus dem Seed abgeleitet. */
export function eventSeed(seed: number): number {
  return (seed ^ 0x5bd1e995) >>> 0;
}

export function createInitialState(seed: number): GameState {
  return {
    seed,
    tick: 0,
    rng: createRngState(seed),
    eventRng: createRngState(eventSeed(seed)),
    nextId: 2,
    finance: createFinance(economyConfig.startingBalanceCents, 0),
    buildings: [{ id: 1, type: 'testHall', ...TEST_HALL, builtTick: 0, paidCents: 0 }],
    roads: [],
    zones: [],
    orders: [],
    vehicles: [],
    tours: [],
    notices: [],
  };
}
