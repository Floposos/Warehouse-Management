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
} as const;
