import type { Cell } from './roadLine';
import { DIRS, cellKey, type RoadNetwork } from './roadNetwork';

interface Node {
  cell: Cell;
  key: number;
  f: number;
  seq: number;
}

/**
 * Kürzester Weg über das Straßennetz (A*, 4 Nachbarn, Kosten 1 je Feld).
 * Liefert die Felder von Start bis Ziel (beide enthalten) oder null, wenn es keinen Weg gibt.
 * Der Start selbst muss keine Straße sein (Fahrzeug auf einem gerade abgerissenen Feld).
 * Gleichstände werden über die Reihenfolge entschieden, daher immer dasselbe Ergebnis.
 */
export function findPath(network: RoadNetwork, from: Cell, to: Cell): Cell[] | null {
  if (!network.has(to.x, to.z)) return null;
  const goal = cellKey(to.x, to.z);
  const h = (c: Cell): number => Math.abs(c.x - to.x) + Math.abs(c.z - to.z);
  const g = new Map<number, number>([[cellKey(from.x, from.z), 0]]);
  const cameFrom = new Map<number, Cell>();
  const open = new MinHeap();
  let seq = 0;
  open.push({ cell: from, key: cellKey(from.x, from.z), f: h(from), seq: seq++ });
  const closed = new Set<number>();
  while (open.size > 0) {
    const node = open.pop();
    if (closed.has(node.key)) continue;
    if (node.key === goal) return rebuild(cameFrom, node.cell);
    closed.add(node.key);
    const cost = (g.get(node.key) ?? 0) + 1;
    for (const d of DIRS) {
      const next = { x: node.cell.x + d.dx, z: node.cell.z + d.dz };
      if (!network.has(next.x, next.z)) continue;
      const key = cellKey(next.x, next.z);
      if (closed.has(key) || cost >= (g.get(key) ?? Infinity)) continue;
      g.set(key, cost);
      cameFrom.set(key, node.cell);
      open.push({ cell: next, key, f: cost + h(next), seq: seq++ });
    }
  }
  return null;
}

function rebuild(cameFrom: Map<number, Cell>, end: Cell): Cell[] {
  const path = [end];
  let current = cameFrom.get(cellKey(end.x, end.z));
  while (current) {
    path.push(current);
    current = cameFrom.get(cellKey(current.x, current.z));
  }
  return path.reverse();
}

/** Kleiner Binär-Heap nach (f, seq). */
class MinHeap {
  private readonly items: Node[] = [];

  get size(): number {
    return this.items.length;
  }

  push(node: Node): void {
    const items = this.items;
    items.push(node);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!less(node, items[parent] as Node)) break;
      items[i] = items[parent] as Node;
      i = parent;
    }
    items[i] = node;
  }

  pop(): Node {
    const items = this.items;
    const top = items[0] as Node;
    const last = items.pop() as Node;
    if (items.length === 0) return top;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      let best = last;
      if (l < items.length && less(items[l] as Node, best)) {
        m = l;
        best = items[l] as Node;
      }
      if (r < items.length && less(items[r] as Node, best)) {
        m = r;
        best = items[r] as Node;
      }
      if (m === i) break;
      items[i] = best;
      i = m;
    }
    items[i] = last;
    return top;
  }
}

function less(a: Node, b: Node): boolean {
  return a.f < b.f || (a.f === b.f && a.seq < b.seq);
}
