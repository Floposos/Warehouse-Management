/** Texte zu Touren und Wegen (T2.1). Teil von `de` (siehe de.ts). */
export const deTours = {
  open: 'Touren',
  openTitle: 'Touren verwalten: Halte, Farbe, LKW',
  title: 'Touren',
  close: 'Touren schließen',
  newTour: 'Neue Tour',
  defaultName: (n: number): string => `Tour ${n}`,
  none: 'Noch keine Touren. „Neue Tour“ legt eine an.',
  name: 'Name',
  color: 'Farbe',
  colorNames: [
    'Rot',
    'Blau',
    'Grün',
    'Orange',
    'Violett',
    'Türkis',
    'Pink',
    'Braun',
    'Hellgrün',
    'Dunkelblau',
  ],
  stops: 'Halte',
  trucks: (n: number): string =>
    n === 0
      ? 'Kein LKW fährt diese Tour.'
      : n === 1
        ? '1 LKW fährt diese Tour.'
        : `${n} LKW fahren diese Tour.`,
  delete: 'Tour löschen',
  deleteConfirm: (name: string): string =>
    `„${name}“ löschen? Ihre LKW fahren danach in der Automatik.`,
  deleteOk: 'Löschen',
  allRoutes: 'Alle Wege',
  allRoutesTitle: 'Wege aller Fahrzeuge in der Farbe ihrer Tour zeigen (Automatik grau)',
  auto: 'Automatik',
  drives: 'Fährt',
  editTour: 'Tour bearbeiten',
  manage: 'Touren …',
  rejected: {
    invalidName: 'Der Name braucht 1 bis 30 Zeichen.',
    invalidColor: 'Unbekannte Farbe.',
    invalidStop: 'Dieser Halt passt nicht zum Ort.',
    tooManyStops: 'Mehr Halte gehen nicht.',
    notFound: 'Die Tour gibt es nicht mehr.',
  } as Record<string, string>,
} as const;
