/**
 * Fahrzeuge. Geschwindigkeit in Tausendstel Feld je Simulationsschritt (400 = 4 Felder je
 * Sekunde bei 1x). ANNAHME: Werte sind Platzhalter bis zum Balancing.
 */
import type { VehicleDrive, VehicleModel } from '../content/vehicleTypes';

/** Werte je Fahrzeugtyp (T2.5). Geschwindigkeit in Tausendstel Feld je Schritt. */
export interface ModelValues {
  speed: number;
  capacity: number;
  priceCents: number;
  dailyCents: number;
  costPerKmCents: number;
}

/**
 * Entscheidung 08.10.2026: Transporter klein, schnell, billig, wenig Ladung; LKW groß,
 * langsam, viel Ladung. LKW-Werte aus der Feinjustierung „Mittel“ (07.10.2026).
 * ANNAHME: Transporter-Werte bis zum Balancing.
 */
export const vehicleModelValues: Record<VehicleModel, ModelValues> = {
  van: { speed: 550, capacity: 8, priceCents: 4_500_000, dailyCents: 20_000, costPerKmCents: 70 },
  truck: {
    speed: 400,
    capacity: 20,
    priceCents: 9_000_000,
    dailyCents: 40_000,
    costPerKmCents: 120,
  },
};

/**
 * Entscheidung 08.10.2026: Elektro nur bei den Kosten (teurer im Kauf, billiger je km).
 * ANNAHME: Kauf × 1,3, Kilometerkosten × 0,5, Tageskosten gleich. Faktoren in Prozent.
 */
export const driveFactors: Record<VehicleDrive, { pricePercent: number; perKmPercent: number }> = {
  diesel: { pricePercent: 100, perKmPercent: 100 },
  electric: { pricePercent: 130, perKmPercent: 50 },
};

/**
 * Leasing (Entscheidung 08.10.2026: feste Laufzeit, günstigere Rate, vorzeitige Rückgabe
 * kostet). ANNAHME: 12 Monate, Monatsrate 3 % des Kaufpreises (erste Rate sofort),
 * Verlängerung automatisch um die gleiche Laufzeit, Strafe bei Rückgabe = 3 Monatsraten
 * (höchstens die noch offenen). Verkauf eines gekauften Fahrzeugs: Restwert 80 % minus
 * 1,5 Prozentpunkte je Monat, mindestens 20 %.
 */
export const leaseConfig = {
  termMonths: 12,
  monthlyPermille: 30,
  earlyReturnPenaltyMonths: 3,
  residualStartPercent: 80,
  residualLossPerMonthPermille: 15,
  residualMinPercent: 20,
} as const;

export const vehicleConfig = {
  supplierSpeed: 400,
  /**
   * Eigene LKW (T1.5). Entscheidung 07.10.2026: Kaufpreis + feste Tageskosten + Kilometerkosten.
   * Feinjustierung nach dem M1-Test (Florian, 07.10.2026): Kosten und Tempo „Mittel“.
   */
  truckSpeed: vehicleModelValues.truck.speed,
  /** Ladung je Fahrt (Einheiten). */
  truckCapacity: vehicleModelValues.truck.capacity,
  /** Kaufpreis (90.000 €), Tageskosten (400 €), Kosten je km (1,20 €). */
  truckPriceCents: vehicleModelValues.truck.priceCents,
  truckDailyCents: vehicleModelValues.truck.dailyCents,
  truckCostPerKmCents: vehicleModelValues.truck.costPerKmCents,
  /** Länge eines Felds in Metern (für die Kilometerkosten). */
  metersPerField: 10,
  /** Automatik: Mindestmenge je Fahrt, damit der LKW nicht für jede Einheit losfährt. */
  truckMinLoad: 5,
  /** Automatik: so oft sucht ein wartender LKW nach Arbeit (Schritte). */
  truckIdleCheckTicks: 25,
  /** Höchstzahl der Halte einer festen Tour. */
  tourMaxStops: 12,
  /** Höchstlänge eines Tour-Namens (Zeichen). */
  tourNameMaxLength: 30,
  /** Abladen bzw. Aufladen je Halt (Schritte). */
  handlingTicks: 30,
  /** Wartezeit, bevor ein Fahrzeug ohne Weg oder ein Auftrag ohne Platz es erneut versucht. */
  retryTicks: 125,
  /** Felder der Eingangsstraße, auf denen Zulieferer außerhalb des Geländes fahren. */
  outsideCells: 12,
} as const;
