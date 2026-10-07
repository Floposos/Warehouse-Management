import { describe, expect, it } from 'vitest';
import { formatDateDe, formatEuro } from './format';

describe('formatDateDe', () => {
  it('formatiert ein ISO-Datum deutsch', () => {
    expect(formatDateDe('2026-10-07T12:00:00Z')).toBe('07.10.2026');
  });

  it('rechnet in Berliner Zeit (kurz vor Mitternacht UTC ist schon der nächste Tag)', () => {
    expect(formatDateDe('2026-12-31T23:30:00Z')).toBe('01.01.2027');
  });

  it('liefert einen Strich bei ungültigem Datum', () => {
    expect(formatDateDe('kein Datum')).toBe('–');
  });
});

describe('formatEuro', () => {
  it('formatiert Cent als ganze Euro mit Tausenderpunkten', () => {
    expect(formatEuro(100_000_000)).toBe('1.000.000 €');
    expect(formatEuro(-12_345_00)).toBe('-12.345 €');
    expect(formatEuro(0)).toBe('0 €');
  });
});
