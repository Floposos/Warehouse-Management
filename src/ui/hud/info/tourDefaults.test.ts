import { describe, expect, it } from 'vitest';
import { testWorld, zoneOf } from '../../../sim/goods/testWorld';
import { defaultStop, productsFor } from './tourDefaults';

describe('Vorschlag für Tour-Halte', () => {
  it('lädt, was der Ort hergibt, und lädt danach passend ab', () => {
    const s = testWorld();
    const a = zoneOf(s, 'A');
    const b = zoneOf(s, 'B');
    const first = defaultStop(s.state, a.id, undefined);
    expect(first).toEqual({ siteId: a.id, action: 'load', product: 'rawA' });
    expect(defaultStop(s.state, b.id, first ?? undefined)).toEqual({
      siteId: b.id,
      action: 'unload',
      product: 'rawA',
    });
    expect(defaultStop(s.state, b.id, undefined)?.product).toBe('combo');
    expect(defaultStop(s.state, 9999, undefined)).toBeNull();
  });

  it('nennt die möglichen Waren je Ort und Aktion', () => {
    const s = testWorld();
    const exit = s.state.buildings.find((b) => b.type === 'exportExit')?.id ?? -1;
    expect(productsFor(s.state, exit, 'unload')).toEqual(['combo', 'final']);
    expect(productsFor(s.state, exit, 'load')).toEqual([]);
    expect(productsFor(s.state, zoneOf(s, 'B').id, 'load')).toEqual(['rawA', 'rawB', 'combo']);
  });
});
