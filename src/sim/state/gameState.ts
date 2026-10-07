import { economyConfig } from '../../config/economy';
import type { BuildingTypeId } from '../../content/buildings';
import type { ProductId } from '../../content/products';
import type { ZoneKind } from '../../content/zones';
import { createRngState, type RngState } from '../core/rng';
import { createFinance, type Finance } from '../finance/ledger';
import type { Side } from '../world/access';

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
}

/** Frei aufgezogene Zone (Lieferort A, B oder C) mit Lager. `x`/`z` = linke obere Ecke. */
export interface Zone {
  id: number;
  kind: ZoneKind;
  x: number;
  z: number;
  width: number;
  depth: number;
  /** Tor-Seite, über die LKW ein- und ausfahren. */
  gate: Side;
  builtTick: number;
  paidCents: number;
  /** Bestand je Ware in Einheiten (nur Waren, die die Zone lagert). */
  stock: Partial<Record<ProductId, number>>;
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
  /** Nächste freie ID für neue Objekte. */
  nextId: number;
  finance: Finance;
  buildings: Building[];
  roads: RoadTile[];
  zones: Zone[];
}

/** Lage der Test-Halle aus M0 (nahe der Eingangsstraße, Mitte der Westseite). */
const TEST_HALL = { x: 12, z: 58 } as const;

export function createInitialState(seed: number): GameState {
  return {
    seed,
    tick: 0,
    rng: createRngState(seed),
    nextId: 2,
    finance: createFinance(economyConfig.startingBalanceCents, 0),
    buildings: [{ id: 1, type: 'testHall', ...TEST_HALL, builtTick: 0, paidCents: 0 }],
    roads: [],
    zones: [],
  };
}
