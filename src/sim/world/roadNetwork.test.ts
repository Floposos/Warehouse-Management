import { describe, expect, it } from 'vitest';
import type { RoadTile } from '../state/gameState';
import { findPath } from './pathfinding';
import { ENTRANCE, RoadNetwork, roadShape } from './roadNetwork';

function net(cells: [number, number][]): RoadNetwork {
  const roads: RoadTile[] = cells.map(([x, z]) => ({ x, z, builtTick: 0, paidCents: 0 }));
  return new RoadNetwork({ roads });
}

function line(x1: number, x2: number, z: number): [number, number][] {
  const out: [number, number][] = [];
  for (let x = x1; x <= x2; x++) out.push([x, z]);
  return out;
}

describe('Verbindungsstücke', () => {
  it('erkennt gerade, Kurve, T-Stück, Kreuzung und Ende', () => {
    // Kreuz um (5, 5) mit Armen, plus Kurve bei (10, 10)
    const n = net([
      [5, 5],
      [4, 5],
      [6, 5],
      [5, 4],
      [5, 6],
      [10, 10],
      [11, 10],
      [10, 11],
    ]);
    expect(roadShape(n.connections(5, 5))).toBe('cross');
    expect(roadShape(n.connections(4, 5))).toBe('end');
    expect(roadShape(n.connections(10, 10))).toBe('curve');
    expect(roadShape(n.connections(20, 20))).toBe('single');
    const t = net([...line(0, 4, 2), [2, 3]]);
    expect(roadShape(t.connections(2, 2))).toBe('tee');
    expect(roadShape(t.connections(1, 2))).toBe('straight');
  });

  it('das Randfeld an der Einfahrt ist mit der Eingangsstraße verbunden', () => {
    const n = net([[0, ENTRANCE.z]]);
    expect(roadShape(n.connections(0, ENTRANCE.z))).toBe('end');
    expect(n.connections(0, ENTRANCE.z)).toBe(8);
  });
});

describe('Wegfindung', () => {
  it('findet den kürzesten Weg und nimmt die Abkürzung', () => {
    // Umweg oben herum (z = 0) und kurze Verbindung unten (z = 4)
    const cells = [...line(0, 10, 0), ...line(0, 10, 4)];
    for (let z = 1; z < 4; z++) cells.push([0, z], [10, z]);
    const path = findPath(net(cells), { x: 0, z: 4 }, { x: 10, z: 4 });
    expect(path).toHaveLength(11);
    expect(path?.every((c) => c.z === 4)).toBe(true);
  });

  it('meldet „kein Weg“ bei getrennten Netzen oder Ziel ohne Straße', () => {
    const n = net([...line(0, 3, 0), ...line(5, 8, 0)]);
    expect(findPath(n, { x: 0, z: 0 }, { x: 8, z: 0 })).toBeNull();
    expect(findPath(n, { x: 0, z: 0 }, { x: 0, z: 9 })).toBeNull();
  });

  it('reagiert auf Abriss: Umweg, dann kein Weg', () => {
    const ring = [...line(0, 6, 0), ...line(0, 6, 3)];
    for (let z = 1; z < 3; z++) ring.push([0, z], [6, z]);
    const direct = findPath(net(ring), { x: 0, z: 0 }, { x: 6, z: 0 });
    expect(direct).toHaveLength(7);
    const withGap = ring.filter(([x, z]) => !(x === 3 && z === 0));
    expect(findPath(net(withGap), { x: 0, z: 0 }, { x: 6, z: 0 })).toHaveLength(13);
    const cut = withGap.filter(([x, z]) => !(x === 3 && z === 3));
    expect(findPath(net(cut), { x: 0, z: 0 }, { x: 6, z: 0 })).toBeNull();
  });

  it('erreicht die Einfahrt von innen', () => {
    const n = net(line(0, 5, ENTRANCE.z));
    const path = findPath(n, { x: 5, z: ENTRANCE.z }, ENTRANCE);
    expect(path?.at(-1)).toEqual(ENTRANCE);
    expect(path).toHaveLength(7);
  });

  it('liefert bei gleich langen Wegen immer denselben', () => {
    const grid: [number, number][] = [];
    for (let z = 0; z < 5; z++) grid.push(...line(0, 4, z));
    const a = findPath(net(grid), { x: 0, z: 0 }, { x: 4, z: 4 });
    const b = findPath(net(grid), { x: 0, z: 0 }, { x: 4, z: 4 });
    expect(a).toHaveLength(9);
    expect(a).toEqual(b);
  });
});
