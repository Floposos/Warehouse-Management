/** Texte zu Meldungen, Fahrzeugen und Flotte (M2). Teil von `de` (siehe de.ts). */
export const deFleet = {
  notices: {
    open: 'Meldungen',
    openTitle: 'Meldungen: Stau, Pannen und mehr. Klick auf eine Meldung zeigt den Ort.',
    openCount: (n: number): string => `Meldungen (${n})`,
    title: 'Meldungen',
    close: 'Meldungen schließen',
    empty: 'Keine Meldungen.',
    show: 'Hinzeigen',
    vehicle: 'Fahrzeug',
    texts: {
      jam: (who: string): string => `Stau: ${who} kommt nicht weiter.`,
      breakdown: (who: string): string => `Panne: ${who} steht und blockiert die Spur.`,
      noWorkshop: (who: string): string =>
        `${who} braucht eine Wartung, aber es gibt keine erreichbare Werkstatt.`,
      leaseRenewed: (who: string): string => `Leasing von ${who} läuft weiter (neue Laufzeit).`,
    },
  },
  fleet: {
    models: { van: 'Transporter', truck: 'LKW' },
    drives: { diesel: 'Diesel', electric: 'Elektro' },
    payment: 'Bezahlung',
    buy: 'Kaufen',
    lease: 'Leasen',
    buyTitle: 'Fahrzeug kaufen: einmal der Kaufpreis, später mit Restwert verkaufbar.',
    leaseTitle: (months: number, penalty: number): string =>
      `Fahrzeug leasen: ${months} Monate feste Laufzeit, Monatsrate (erste sofort), verlängert sich danach von selbst. Vorzeitige Rückgabe kostet bis zu ${penalty} Raten.`,
    itemName: (model: string, drive: string): string => `${model} ${drive}`,
    perMonth: (rate: string): string => `${rate} / Monat`,
    itemTitle: (
      name: string,
      capacity: number,
      cost: string,
      daily: string,
      perKm: string,
    ): string =>
      `${name}: lädt ${capacity} Einheiten. ${cost}, dazu ${daily} am Tag und ${perKm} je km. Erscheint an der Einfahrt und fährt automatisch.`,
    bought: (name: string): string => `${name} angeschafft, fährt an der Einfahrt los.`,
    noMoney: 'Nicht genug Geld für dieses Fahrzeug.',
    type: 'Fahrzeug',
    typeLine: (model: string, drive: string, capacity: number): string =>
      `${model}, ${drive}, lädt ${capacity}`,
    ownership: 'Besitz',
    owned: (residual: string): string => `Gekauft · Restwert ${residual}`,
    leased: (rate: string, end: string): string => `Geleast · ${rate} / Monat bis ${end}`,
    sell: 'Verkaufen',
    giveBack: 'Leasing zurückgeben',
    sellConfirm: (name: string, amount: string): string =>
      `${name} für ${amount} verkaufen? Das Fahrzeug verschwindet sofort, Ladung geht verloren.`,
    giveBackConfirm: (name: string, penalty: string): string =>
      `${name} zurückgeben? Vorzeitige Rückgabe kostet ${penalty}. Das Fahrzeug verschwindet sofort, Ladung geht verloren.`,
    disposed: (name: string): string => `${name} abgegeben.`,
  },
} as const;
