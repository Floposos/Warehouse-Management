import { describe, expect, it } from 'vitest';
import { EventBus } from './eventBus';
import type { SimEvent } from './events';

describe('EventBus', () => {
  it('verteilt erst bei flush, in Meldereihenfolge', () => {
    const bus = new EventBus();
    const seen: string[] = [];
    bus.onAny((e) => seen.push(e.type));
    bus.emit({ type: 'time/yearStarted', year: 2001 });
    bus.emit({ type: 'time/monthStarted', year: 2001, month: 1 });
    expect(seen).toEqual([]);
    bus.flush();
    expect(seen).toEqual(['time/yearStarted', 'time/monthStarted']);
  });

  it('ruft nur Zuhörer des passenden Typs und erlaubt Abmelden', () => {
    const bus = new EventBus();
    const years: number[] = [];
    const off = bus.on('time/yearStarted', (e) => years.push(e.year));
    bus.emit({ type: 'time/monthStarted', year: 2000, month: 2 });
    bus.emit({ type: 'time/yearStarted', year: 2001 });
    bus.flush();
    off();
    bus.emit({ type: 'time/yearStarted', year: 2002 });
    bus.flush();
    expect(years).toEqual([2001]);
  });

  it('verteilt Ereignisse, die während der Verteilung entstehen, im selben flush', () => {
    const bus = new EventBus();
    const seen: SimEvent['type'][] = [];
    bus.on('time/yearStarted', () => bus.emit({ type: 'time/monthStarted', year: 1, month: 1 }));
    bus.onAny((e) => seen.push(e.type));
    bus.emit({ type: 'time/yearStarted', year: 1 });
    bus.flush();
    expect(seen).toEqual(['time/yearStarted', 'time/monthStarted']);
    expect(bus.pendingCount).toBe(0);
  });
});
