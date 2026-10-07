import { describe, expect, it } from 'vitest';
import { createRngState, nextFloat, nextInt } from './rng';

describe('rng', () => {
  it('liefert bei gleichem Seed dieselbe Folge', () => {
    const a = createRngState(42);
    const b = createRngState(42);
    const seqA = Array.from({ length: 100 }, () => nextFloat(a));
    const seqB = Array.from({ length: 100 }, () => nextFloat(b));
    expect(seqA).toEqual(seqB);
  });

  it('liefert bei anderem Seed eine andere Folge', () => {
    expect(nextFloat(createRngState(1))).not.toBe(nextFloat(createRngState(2)));
  });

  it('bleibt in [0, 1) und nextInt in den Grenzen', () => {
    const rng = createRngState(7);
    for (let i = 0; i < 1000; i++) {
      const f = nextFloat(rng);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = nextInt(rng, 3, 5);
      expect([3, 4, 5]).toContain(n);
    }
  });

  it('setzt nach JSON-Rundreise exakt fort', () => {
    const rng = createRngState(99);
    nextFloat(rng);
    const copy = JSON.parse(JSON.stringify(rng)) as typeof rng;
    expect(nextFloat(copy)).toBe(nextFloat(rng));
  });
});
