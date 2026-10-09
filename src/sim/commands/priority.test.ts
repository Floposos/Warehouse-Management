import { describe, expect, it } from 'vitest';
import { testWorld } from '../goods/testWorld';

describe('Vorfahrtsstraßen markieren (T2.2)', () => {
  const mark = (priority: boolean, fromX: number, toX: number) => ({
    type: 'road/setPriority' as const,
    fromX,
    fromZ: 61,
    toX,
    toZ: 61,
    xFirst: true,
    priority,
  });

  it('markiert nur Straßenfelder der Strecke, kostenlos, und entfernt die Markierung wieder', () => {
    const s = testWorld();
    const balance = s.state.finance.balanceCents;
    expect(s.execute(mark(true, 0, 10)).ok).toBe(true);
    const marked = s.state.roads.filter((r) => r.priority);
    expect(marked).toHaveLength(11);
    expect(s.state.finance.balanceCents).toBe(balance);
    expect(s.execute(mark(false, 5, 20)).ok).toBe(true);
    expect(s.state.roads.filter((r) => r.priority).map((r) => r.x)).toEqual([0, 1, 2, 3, 4]);
  });

  it('ohne Straße auf der Strecke wird abgelehnt', () => {
    const s = testWorld();
    expect(
      s.execute({
        type: 'road/setPriority',
        fromX: 60,
        fromZ: 10,
        toX: 70,
        toZ: 10,
        xFirst: true,
        priority: true,
      }),
    ).toMatchObject({ ok: false, reason: 'noRoad' });
  });
});
