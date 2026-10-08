import { describe, expect, it } from 'vitest';
import { zoneConfig } from '../../config/zones';
import { TICKS_PER_DAY } from '../core/gameTime';
import { Simulation } from '../core/simulation';
import { createInitialState } from '../state/gameState';
import { shapeArea } from '../world/zoneShape';

const zone = (kind: 'A' | 'B' | 'C', fromX: number, fromZ: number, toX: number, toZ: number) =>
  ({ type: 'zone/place', kind, fromX, fromZ, toX, toZ }) as const;
const cell = (zoneId: number, x: number, z: number) =>
  ({ type: 'zone/demolishCell', zoneId, x, z }) as const;

function first(s: Simulation) {
  const z = s.state.zones[0];
  if (!z) throw new Error('Zone fehlt');
  return z;
}

describe('Einzelne Zonenfelder abreißen (Florian, 08.10.2026)', () => {
  it('Eckfeld: Zone schrumpft, Erstattung für ein Feld', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('A', 40, 40, 42, 42));
    const z = first(s);
    const before = s.state.finance.balanceCents;
    expect(s.execute(cell(z.id, 40, 40))).toEqual({ ok: true });
    expect(s.state.zones).toHaveLength(1);
    expect(shapeArea(z.parts)).toBe(8);
    expect(s.state.finance.balanceCents - before).toBe(zoneConfig.costPerFieldCents.A);
    // Bezahlter Betrag der übrigen Teile bleibt vollständig erhalten.
    expect(z.parts.reduce((n, p) => n + p.paidCents, 0)).toBe(8 * zoneConfig.costPerFieldCents.A);
  });

  it('Mittelfeld einer Reihe: Zone zerfällt in zwei, Bestand wird nach Fläche geteilt', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('C', 40, 40, 44, 40));
    const z = first(s);
    z.stock = { combo: 10, final: 5 };
    expect(s.execute(cell(z.id, 42, 40))).toEqual({ ok: true });
    expect(s.state.zones).toHaveLength(2);
    const [a, b] = s.state.zones;
    expect(a?.id).toBe(z.id);
    expect(shapeArea(a?.parts ?? [])).toBe(2);
    expect(shapeArea(b?.parts ?? [])).toBe(2);
    expect(b?.gate).toBe(a?.gate);
    expect((a?.stock.combo ?? 0) + (b?.stock.combo ?? 0)).toBe(10);
    expect((a?.stock.final ?? 0) + (b?.stock.final ?? 0)).toBe(5);
  });

  it('Bestand über dem neuen Lager geht verloren', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('A', 40, 40, 41, 40));
    const z = first(s);
    z.stock = { rawA: 20 };
    s.execute(cell(z.id, 41, 40));
    expect(z.stock.rawA).toBe(zoneConfig.capacityPerField);
  });

  it('letztes Feld: Zone verschwindet', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('B', 40, 40, 40, 40));
    s.execute(cell(first(s).id, 40, 40));
    expect(s.state.zones).toEqual([]);
  });

  it('später abgerissen: 50 % Erstattung; Feld außerhalb: abgelehnt', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('A', 40, 40, 41, 40));
    const z = first(s);
    s.run(TICKS_PER_DAY);
    const before = s.state.finance.balanceCents;
    s.execute(cell(z.id, 40, 40));
    expect(s.state.finance.balanceCents - before).toBe(zoneConfig.costPerFieldCents.A / 2);
    expect(s.execute(cell(z.id, 10, 10)).ok).toBe(false);
  });
});
