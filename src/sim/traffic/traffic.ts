import type { GameState } from '../state/gameState';
import type { Vehicle } from '../vehicles/types';
import type { Cell } from '../world/roadLine';
import { cellKey, type RoadNetwork } from '../world/roadNetwork';
import type { EntranceGate } from './entrance';
import { grantJunctions } from './junctions';
import { headingBetween, laneKey, type Heading } from './lanes';

/**
 * Verkehrslage eines Schritts (T2.2/T2.3), aus dem Zustand abgeleitet, nie gespeichert:
 * belegte Fahrspuren, Kreuzungsfreigaben und belegte Stellplätze. Fahrzeuge auf der
 * Fahrbahn belegen ihr Feld und, sobald sie losfahren, auch das nächste. Ein Feld mit drei
 * oder vier Anschlüssen (T-Stück, Kreuzung) gehört immer nur einem Fahrzeug.
 */
export class Traffic {
  private readonly lanes = new Map<number, number>();
  private readonly cellUse = new Map<number, number>();
  private readonly bayUse = new Map<number, number>();
  private readonly junctionCache = new Map<number, boolean>();
  readonly priority = new Set<number>();
  private readonly granted: Set<number>;
  /** Einfahrt mit externem Verkehr (T2.7); fehlt in reinen Verkehrstests. */
  gate: EntranceGate | null = null;

  constructor(
    readonly network: RoadNetwork,
    state: Pick<GameState, 'vehicles' | 'roads'>,
  ) {
    for (const r of state.roads) if (r.priority) this.priority.add(cellKey(r.x, r.z));
    for (const v of state.vehicles) {
      if (v.bayAt !== null) this.bayUse.set(v.bayAt, (this.bayUse.get(v.bayAt) ?? 0) + 1);
      if (!v.offRoad) this.occupy(v);
    }
    this.granted = grantJunctions(this, state.vehicles);
  }

  /** T-Stück oder Kreuzung (drei oder vier Anschlüsse). */
  isJunction(c: Cell): boolean {
    const key = cellKey(c.x, c.z);
    let result = this.junctionCache.get(key);
    if (result === undefined) {
      const mask = this.network.has(c.x, c.z) ? this.network.connections(c.x, c.z) : 0;
      result = [1, 2, 4, 8].filter((b) => mask & b).length >= 3;
      this.junctionCache.set(key, result);
    }
    return result;
  }

  laneFree(c: Cell, heading: Heading): boolean {
    return !this.lanes.has(laneKey(c, heading));
  }

  cellFree(c: Cell): boolean {
    return (this.cellUse.get(cellKey(c.x, c.z)) ?? 0) === 0;
  }

  /** Wer die Spur belegt (für die Stau-Erkennung); undefined = frei. */
  holderOf(c: Cell, heading: Heading): number | undefined {
    return this.lanes.get(laneKey(c, heading));
  }

  claim(v: Vehicle, c: Cell, heading: Heading): void {
    const key = laneKey(c, heading);
    if (this.lanes.get(key) === v.id) return;
    this.lanes.set(key, v.id);
    const cell = cellKey(c.x, c.z);
    this.cellUse.set(cell, (this.cellUse.get(cell) ?? 0) + 1);
  }

  release(v: Vehicle, c: Cell, heading: Heading): void {
    const key = laneKey(c, heading);
    if (this.lanes.get(key) !== v.id) return;
    this.lanes.delete(key);
    const cell = cellKey(c.x, c.z);
    this.cellUse.set(cell, (this.cellUse.get(cell) ?? 1) - 1);
  }

  /** Belegt Feld und gegebenenfalls das nächste (Fahrzeug fährt gerade hinüber). */
  occupy(v: Vehicle): void {
    const [here, next] = v.route;
    if (!here) return;
    this.claim(v, here, v.heading);
    if (v.progress > 0 && next) this.claim(v, next, headingBetween(here, next));
  }

  /** Fahrzeug verlässt die Fahrbahn (Stellplatz, Parken): Spuren werden frei. */
  vacate(v: Vehicle): void {
    const [here, next] = v.route;
    if (here) this.release(v, here, v.heading);
    if (here && next) this.release(v, next, headingBetween(here, next));
  }

  /**
   * Darf das Fahrzeug (Fortschritt 0) ins nächste Feld? In eine Kreuzung nur mit Freigabe,
   * sonst wenn die Spur frei ist. Wer abseits steht, braucht zusätzlich Platz zum Einfädeln.
   */
  canEnter(v: Vehicle): boolean {
    const [here, next] = v.route;
    if (!here || !next) return false;
    if (this.gate && !this.gate.allows(v, here, next)) return false;
    const heading = headingBetween(here, next);
    if (
      v.offRoad &&
      !(this.isJunction(here) ? this.cellFree(here) : this.laneFree(here, heading))
    ) {
      return false;
    }
    return this.isJunction(next) ? this.granted.has(v.id) : this.laneFree(next, heading);
  }

  baysUsed(siteId: number): number {
    return this.bayUse.get(siteId) ?? 0;
  }

  /** Stellplatz am Ort belegen, wenn einer frei ist; das Fahrzeug verlässt die Fahrbahn. */
  takeBay(v: Vehicle, siteId: number, capacity: number): boolean {
    if (v.bayAt === siteId) return true;
    if (this.baysUsed(siteId) >= capacity) return false;
    this.vacate(v);
    v.offRoad = true;
    v.bayAt = siteId;
    this.bayUse.set(siteId, this.baysUsed(siteId) + 1);
    return true;
  }

  /** Stellplatz freigeben; das Fahrzeug bleibt abseits stehen, bis es einfädelt. */
  leaveBay(v: Vehicle): void {
    if (v.bayAt === null) return;
    this.bayUse.set(v.bayAt, Math.max(0, this.baysUsed(v.bayAt) - 1));
    v.bayAt = null;
  }

  /** Abseits parken (wartet ohne Auftrag oder ohne Weg). */
  park(v: Vehicle): void {
    if (v.offRoad) return;
    this.vacate(v);
    v.offRoad = true;
  }
}
