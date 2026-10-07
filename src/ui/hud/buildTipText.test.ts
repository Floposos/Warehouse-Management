import { describe, expect, it } from 'vitest';
import { buildTipText } from './buildTipText';

const footprint = { x: 0, z: 0, width: 8, depth: 6 };
const command = { type: 'build/demolish', buildingId: 1 } as const;

describe('Bau-Tooltip', () => {
  it('zeigt Kosten oder Grund mit Kosten', () => {
    const base = { kind: 'place', footprint, height: 2, costCents: 5_000_000, command } as const;
    expect(buildTipText({ ...base, reason: null })).toEqual({
      text: 'Kosten: 50.000 €',
      kind: 'ok',
    });
    expect(buildTipText({ ...base, reason: 'insufficientFunds' })).toEqual({
      text: 'Nicht genug Geld · Kosten: 50.000 €',
      kind: 'error',
    });
  });

  it('zeigt beim Abriss die Erstattung', () => {
    expect(
      buildTipText({ kind: 'demolish', footprint, height: 2, refundCents: 2_500_000, command }),
    ).toEqual({ text: 'Abreißen, Erstattung: 25.000 €', kind: 'ok' });
  });
});
