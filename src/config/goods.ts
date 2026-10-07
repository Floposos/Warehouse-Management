/**
 * Waren, Einkauf und Verkauf. Geld in Cent.
 * Entscheidungen 07.10.2026: Rohware per Dauerauftrag (täglich/wöchentlich/monatlich) oder
 * Einzelbestellung, Preis je Ware unterschiedlich; Export zum festen Preis je Ware; das
 * Endprodukt ist etwas mehr wert als die Kombi; die Kette ist großzügig rentabel.
 * Euro-Werte sind Balancing-Platzhalter, Florian justiert nach dem M1-Test.
 */
export const goodsConfig = {
  /** Einkaufspreis je Einheit Rohware (A 15 €, B 20 €). */
  purchasePriceCents: { rawA: 1_500, rawB: 2_000 },
  /** Verkaufspreis je Einheit an der Export-Ausfahrt (Kombi 110 €, Endprodukt 130 €). */
  exportPriceCents: { combo: 11_000, final: 13_000 },
  /** Wählbare Bestellmengen (Einheiten) und Vorauswahl. */
  orderQuantities: [10, 20, 50, 100],
  defaultOrderQuantity: 20,
} as const;
