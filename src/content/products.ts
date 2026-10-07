/**
 * Waren der Produktkette in M1: Rohware A und B kommen herein, B kombiniert A + B
 * zur Kombi, C verarbeitet sie zum Endprodukt (Entscheidung 07.10.2026), das exportiert wird.
 * Namen in ui/texts/de.ts, Farben für Kisten.
 * ANNAHME: Name „Endprodukt“ ist ein Platzhalter, bis Florian ihn festlegt.
 */
export const productIds = ['rawA', 'rawB', 'combo', 'final'] as const;
export type ProductId = (typeof productIds)[number];

export interface Product {
  id: ProductId;
  /** Kistenfarbe (Akzentfarbe im Stil „Hell & freundlich“). */
  color: number;
}

export const products: Record<ProductId, Product> = {
  rawA: { id: 'rawA', color: 0x4f9dde },
  rawB: { id: 'rawB', color: 0xf2b134 },
  combo: { id: 'combo', color: 0x9b6fd6 },
  final: { id: 'final', color: 0x3fb68b },
};
