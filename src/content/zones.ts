import type { ProductId } from './products';

/**
 * Lieferorte als frei aufziehbare Zonen (Entscheidung 07.10.2026), dazu die Werkstatt W
 * (T2.6, Entscheidung 08.10.2026: Werkstatt bauen). Namen in ui/texts/de.ts.
 */
export const zoneKinds = ['A', 'B', 'C', 'W'] as const;
export type ZoneKind = (typeof zoneKinds)[number];

export interface ZoneType {
  kind: ZoneKind;
  /** Waren, die hier gelagert werden (je Ware eigene Kapazität). */
  stores: readonly ProductId[];
  /** Bodenfarbe der Zone. */
  color: number;
}

/** Entscheidung 07.10.2026: Kapazität gilt je Ware getrennt; C verarbeitet die Kombi weiter. */
export const zoneTypes: Record<ZoneKind, ZoneType> = {
  A: { kind: 'A', stores: ['rawA'], color: 0xa9cff2 },
  B: { kind: 'B', stores: ['rawA', 'rawB', 'combo'], color: 0xf7d792 },
  C: { kind: 'C', stores: ['combo', 'final'], color: 0xd4c1f0 },
  W: { kind: 'W', stores: [], color: 0xc3ccd4 },
};
