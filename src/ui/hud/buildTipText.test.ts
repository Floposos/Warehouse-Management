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

  it('zeigt bei Straßen Länge und Kosten', () => {
    const cells = [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
    ];
    const road = { kind: 'road' as const, cells, blocked: [], costCents: 50_000, command };
    expect(buildTipText({ ...road, reason: null })).toEqual({
      text: '2 Felder · Kosten: 500 €',
      kind: 'ok',
    });
    expect(buildTipText({ ...road, reason: 'occupied' }).kind).toBe('error');
  });

  it('zeigt bei Zonen Größe, Lager, Kosten und fehlenden Anschluss', () => {
    const zone = {
      kind: 'zone' as const,
      footprint: { x: 0, z: 0, width: 4, depth: 3 },
      capacity: 120,
      costCents: 240_000,
      reason: null,
      notConnected: true,
      merges: false,
      bays: null as number | null,
      command,
    };
    expect(buildTipText({ ...zone, bays: 3 })).toEqual({
      text: '4 × 3 Felder · 3 Werkstattplätze · Kosten: 2.400 €',
      kind: 'ok',
      warning: 'Nicht angeschlossen: Straße an das Tor bauen',
    });
    expect(buildTipText({ ...zone, bays: null })).toEqual({
      text: '4 × 3 Felder · Lager 120 je Ware · Kosten: 2.400 €',
      kind: 'ok',
      warning: 'Nicht angeschlossen: Straße an das Tor bauen',
    });
  });

  it('zeigt beim Abriss die Erstattung', () => {
    expect(
      buildTipText({
        kind: 'demolish',
        footprints: [footprint],
        height: 2,
        refundCents: 2_500_000,
        command,
      }),
    ).toEqual({ text: 'Abreißen, Erstattung: 25.000 €', kind: 'ok' });
  });
});
