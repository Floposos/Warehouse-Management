import { describe, expect, it } from 'vitest';
import { zoneConfig } from '../../config/zones';
import { Simulation } from '../core/simulation';
import { createInitialState } from '../state/gameState';
import { RoadNetwork } from '../world/roadNetwork';
import { siteAccess, sites } from '../world/sites';
import { checkPlaceZone, zoneCapacity } from './zones';

const zone = (kind: 'A' | 'B' | 'C', fromX: number, fromZ: number, toX: number, toZ: number) =>
  ({ type: 'zone/place', kind, fromX, fromZ, toX, toZ }) as const;

describe('Zonen aufziehen', () => {
  it('Rechteck in jede Richtung, Kosten je Feld und Art, Lager je Ware', () => {
    const s = new Simulation(createInitialState(1));
    const start = s.state.finance.balanceCents;
    expect(s.execute(zone('B', 44, 43, 40, 40))).toEqual({ ok: true });
    const placed = s.state.zones[0];
    expect(placed).toMatchObject({ kind: 'B', parts: [{ x: 40, z: 40, width: 5, depth: 4 }] });
    expect(placed?.stock).toEqual({ rawA: 0, rawB: 0, combo: 0 });
    expect(s.state.finance.balanceCents).toBe(start - 20 * zoneConfig.costPerFieldCents.B);
    expect(zoneCapacity({ x: 0, z: 0, width: 5, depth: 4 })).toBe(20 * zoneConfig.capacityPerField);
  });

  it('ein einzelnes Feld genügt (keine Mindestgröße)', () => {
    expect(
      checkPlaceZone(createInitialState(1), 'A', { x: 5, z: 5 }, { x: 5, z: 5 }),
    ).toMatchObject({
      ok: true,
      footprint: { width: 1, depth: 1 },
    });
  });

  it('lehnt Überschneidung, Rand und fehlendes Geld ab', () => {
    const state = createInitialState(1);
    expect(checkPlaceZone(state, 'A', { x: 10, z: 55 }, { x: 14, z: 60 })).toMatchObject({
      reason: 'occupied',
    });
    expect(checkPlaceZone(state, 'A', { x: 126, z: 0 }, { x: 128, z: 2 })).toMatchObject({
      reason: 'outOfBounds',
    });
    state.finance.balanceCents = 0;
    expect(checkPlaceZone(state, 'C', { x: 0, z: 0 }, { x: 1, z: 1 })).toMatchObject({
      reason: 'insufficientFunds',
    });
  });

  it('Abriss erstattet nach der Tagesregel', () => {
    const s = new Simulation(createInitialState(1));
    s.execute(zone('C', 0, 0, 2, 2));
    const before = s.state.finance.balanceCents;
    const id = s.state.zones[0]?.id ?? 0;
    expect(s.execute({ type: 'zone/demolish', zoneId: id })).toEqual({ ok: true });
    expect(s.state.zones).toEqual([]);
    expect(s.state.finance.balanceCents).toBe(before + 9 * zoneConfig.costPerFieldCents.C);
  });
});

describe('Tor und Anschluss', () => {
  it('schlägt die Seite mit Straße vor; ohne Straße Süden und nicht angeschlossen', () => {
    const s = new Simulation(createInitialState(1));
    s.execute({ type: 'road/build', fromX: 30, fromZ: 39, toX: 40, toZ: 39, xFirst: true });
    s.execute(zone('A', 30, 40, 33, 42));
    s.execute(zone('C', 60, 60, 62, 62));
    const [a, c] = s.state.zones;
    expect(a?.gate).toBe('N');
    expect(c?.gate).toBe('S');
    const network = new RoadNetwork(s.state);
    const [siteA, siteC] = sites(s.state);
    expect(siteA && siteAccess(network, siteA)).toEqual({ x: 31, z: 39 });
    expect(siteC && siteAccess(network, siteC)).toBeNull();
  });

  it('nur die gewählte Tor-Seite zählt', () => {
    const s = new Simulation(createInitialState(1));
    s.execute({ type: 'road/build', fromX: 30, fromZ: 39, toX: 40, toZ: 39, xFirst: true });
    s.execute(zone('A', 30, 40, 33, 42));
    const id = s.state.zones[0]?.id ?? 0;
    expect(s.execute({ type: 'zone/setGate', zoneId: id, gate: 'W' })).toEqual({ ok: true });
    const site = sites(s.state)[0];
    expect(site && siteAccess(new RoadNetwork(s.state), site)).toBeNull();
  });
});

describe('Export-Ausfahrt', () => {
  it('muss am Rand stehen, Tor zeigt ins Gelände', () => {
    const s = new Simulation(createInitialState(1));
    const place = (x: number, z: number) =>
      s.execute({ type: 'build/place', buildingType: 'exportExit', x, z });
    expect(place(60, 60)).toEqual({ ok: false, reason: 'notAtEdge' });
    expect(place(124, 60)).toEqual({ ok: true });
    expect(sites(s.state).find((x) => x.kind === 'export')).toMatchObject({ gate: 'W' });
  });
});
