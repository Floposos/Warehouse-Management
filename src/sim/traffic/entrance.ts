import { entranceConfig as ec } from '../../config/entrance';
import { TICKS_PER_DAY } from '../core/gameTime';
import type { GameState } from '../state/gameState';
import type { Vehicle } from '../vehicles/types';
import type { Cell } from '../world/roadLine';
import { ENTRANCE } from '../world/roadNetwork';

export type GateDirection = 'in' | 'out';

/** Nächste erlaubte Durchfahrt je Richtung (T2.7, im Spielstand). */
export interface EntranceState {
  nextInTick: number;
  nextOutTick: number;
}

/** Minute des Tages (0 … 1439) zu einem Schritt. */
export function minuteOfDay(tick: number): number {
  return Math.floor(((tick % TICKS_PER_DAY) * 1440) / TICKS_PER_DAY);
}

/** Verkehrsfaktor in Prozent (100 = normal), mit sanftem Übergang um die Rushhour. */
export function trafficFactorPercent(tick: number): number {
  const m = minuteOfDay(tick);
  let best = 100;
  for (const [from, to] of ec.rushHours) {
    const start = from * 60;
    const end = to * 60;
    let share = 0;
    if (m >= start && m < end) share = 1;
    else if (m >= start - ec.rampMinutes && m < start)
      share = (m - start + ec.rampMinutes) / ec.rampMinutes;
    else if (m >= end && m < end + ec.rampMinutes)
      share = (end + ec.rampMinutes - m) / ec.rampMinutes;
    best = Math.max(best, Math.round(100 + (ec.rushFactorPercent - 100) * share));
  }
  return best;
}

export function isRushHour(tick: number): boolean {
  return trafficFactorPercent(tick) >= ec.rushFactorPercent;
}

/** Wartezeit zum Einfädeln an der Einfahrt (Schritte). */
export function mergeTicks(tick: number): number {
  return Math.round((ec.baseMergeTicks * trafficFactorPercent(tick)) / 100);
}

/** Überquert der Schritt von `here` nach `next` die Einfahrt? */
export function gateCrossing(here: Cell, next: Cell): GateDirection | null {
  if (here.z !== ENTRANCE.z || next.z !== ENTRANCE.z) return null;
  if (here.x === ENTRANCE.x - 1 && next.x === ENTRANCE.x) return 'in';
  if (here.x === ENTRANCE.x && next.x === ENTRANCE.x - 1) return 'out';
  return null;
}

/**
 * Einfahrt mit externem Verkehr (T2.7): Wer hinein oder hinaus will, wartet an der
 * Feldgrenze, bis er eingefädelt ist (`mergeTicks`, in der Rushhour länger), und je
 * Richtung fährt immer nur einer im Abstand von `mergeTicks`. Deterministisch nach Schritten.
 */
export class EntranceGate {
  constructor(private readonly state: Pick<GameState, 'tick' | 'entrance'>) {}

  allows(v: Vehicle, here: Cell, next: Cell): boolean {
    const dir = gateCrossing(here, next);
    if (!dir) return true;
    const e = this.state.entrance;
    const nextTick = dir === 'in' ? e.nextInTick : e.nextOutTick;
    return v.waitTicks >= mergeTicks(this.state.tick) && this.state.tick >= nextTick;
  }

  pass(here: Cell, next: Cell): void {
    const dir = gateCrossing(here, next);
    if (!dir) return;
    const at = this.state.tick + mergeTicks(this.state.tick);
    if (dir === 'in') this.state.entrance.nextInTick = at;
    else this.state.entrance.nextOutTick = at;
  }
}
