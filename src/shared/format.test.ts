import { describe, expect, it } from 'vitest';
import { formatDateDe, formatDateTimeDe, formatEuro, formatSignedEuro } from './format';

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

describe('formatDateTimeDe', () => {
  it('zeigt Datum und Uhrzeit in Berliner Zeit', () => {
    expect(formatDateTimeDe('2026-10-07T16:05:00Z')).toBe('07.10.2026, 18:05');
  });
});

describe('formatSignedEuro', () => {
  it('zeigt Plus und echtes Minuszeichen', () => {
    expect(formatSignedEuro(50_000)).toBe('+500 €');
    expect(formatSignedEuro(-5_000_000)).toBe('−50.000 €');
    expect(formatSignedEuro(0)).toBe('0 €');
  });
});
