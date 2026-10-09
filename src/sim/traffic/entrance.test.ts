import { describe, expect, it } from 'vitest';
import { entranceConfig } from '../../config/entrance';
import { TICKS_PER_DAY } from '../core/gameTime';
import { testWorld } from '../goods/testWorld';
import { ENTRANCE } from '../world/roadNetwork';
import { gateCrossing, isRushHour, mergeTicks, trafficFactorPercent } from './entrance';

const hour = (h: number, m = 0): number => Math.round(((h * 60 + m) * TICKS_PER_DAY) / 1440);

describe('Rushhour (T2.7)', () => {
  it('7–9 und 16–18 Uhr dreifach, mit einer Stunde Übergang, sonst normal', () => {
    expect(trafficFactorPercent(hour(3))).toBe(100);
    expect(trafficFactorPercent(hour(6, 30))).toBe(200);
    expect(trafficFactorPercent(hour(8))).toBe(entranceConfig.rushFactorPercent);
    expect(trafficFactorPercent(hour(9, 30))).toBe(200);
    expect(trafficFactorPercent(hour(12))).toBe(100);
    expect(isRushHour(hour(17))).toBe(true);
    expect(isRushHour(hour(19))).toBe(false);
    expect(mergeTicks(hour(12))).toBe(entranceConfig.baseMergeTicks);
    expect(mergeTicks(hour(8))).toBe(3 * entranceConfig.baseMergeTicks);
  });

  it('erkennt nur den Übergang an der Einfahrt', () => {
    const outside = { x: ENTRANCE.x - 1, z: ENTRANCE.z };
    expect(gateCrossing(outside, ENTRANCE)).toBe('in');
    expect(gateCrossing(ENTRANCE, outside)).toBe('out');
    expect(gateCrossing(ENTRANCE, { x: 0, z: ENTRANCE.z })).toBeNull();
  });
});

describe('Einfahrt mit externem Verkehr (T2.7)', () => {
  /** Schritte, bis drei gleichzeitig bestellte Zulieferer alle auf dem Gelände sind. */
  function entryTime(startTick: number): number {
    const s = testWorld();
    s.state.tick = startTick;
    for (let i = 0; i < 3; i++) {
      s.execute({ type: 'order/create', product: 'rawA', quantity: 5, interval: 'once' });
    }
    s.step(); // Bestellungen schicken die Zulieferer im nächsten Schritt los
    const suppliers = s.state.vehicles.filter((v) => v.kind === 'supplier');
    expect(suppliers).toHaveLength(3);
    for (let i = 1; i < TICKS_PER_DAY; i++) {
      s.step();
      if (suppliers.every((v) => (v.route[0]?.x ?? -99) >= ENTRANCE.x)) return i;
    }
    throw new Error('Zulieferer kamen nicht herein');
  }

  it('in der Rushhour dauert das Hereinfahren spürbar länger', () => {
    const normal = entryTime(hour(12));
    const rush = entryTime(hour(8));
    expect(rush - normal).toBeGreaterThanOrEqual(3 * 2 * entranceConfig.baseMergeTicks);
  });

  it('immer nur ein Fahrzeug je Richtung im Abstand der Einfädelzeit', () => {
    const s = testWorld();
    s.state.tick = hour(12);
    for (let i = 0; i < 3; i++) {
      s.execute({ type: 'order/create', product: 'rawA', quantity: 5, interval: 'once' });
    }
    const crossed: number[] = [];
    const inside = new Set<number>();
    for (let i = 0; i < 300; i++) {
      s.step();
      for (const v of s.state.vehicles) {
        if ((v.route[0]?.x ?? -99) >= ENTRANCE.x && !inside.has(v.id)) {
          inside.add(v.id);
          crossed.push(s.state.tick);
        }
      }
    }
    expect(crossed).toHaveLength(3);
    for (let i = 1; i < crossed.length; i++) {
      expect((crossed[i] ?? 0) - (crossed[i - 1] ?? 0)).toBeGreaterThanOrEqual(
        entranceConfig.baseMergeTicks,
      );
    }
  });
});
