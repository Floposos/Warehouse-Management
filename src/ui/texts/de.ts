/** Alle deutschen Oberflächentexte an einer Stelle. */
export const de = {
  title: 'Logistikum',
  subtitle: 'Logistik-Campus-Manager',
  noWebgl: 'Dein Browser kann leider keine 3D-Grafik (WebGL) anzeigen.',
  common: { ok: 'OK', cancel: 'Abbrechen', close: 'Schließen' },
  menu: {
    newGame: 'Neues Spiel',
    load: 'Laden',
    settings: 'Einstellungen',
    download: 'Download (ZIP)',
    downloadHint: 'Spielbare Version zum Entpacken und Doppelklicken',
  },
  pause: {
    title: 'Spiel pausiert',
    resume: 'Weiterspielen',
    save: 'Speichern',
    load: 'Laden',
    settings: 'Einstellungen',
    mainMenu: 'Hauptmenü',
    leaveTitle: 'Zum Hauptmenü?',
    leaveMessage: 'Nicht gespeicherter Fortschritt geht verloren.',
    leaveConfirm: 'Zum Hauptmenü',
  },
  hud: {
    pause: 'Pause',
    paused: 'PAUSE',
    menu: 'Menü',
    speed: (s: number): string => `${s}x`,
    speedTitle: (s: number, key: number): string => `Geschwindigkeit ${s}x (Taste ${key})`,
    pauseTitle: 'Pause / Weiter (Leertaste)',
    menuTitle: 'Menü (Esc)',
    balanceTitle: 'Kontostand',
    weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  },
  settings: {
    title: 'Einstellungen',
    autosave: 'Autosave-Intervall',
    autosaveOption: (m: number): string => `alle ${m} Minuten`,
    cameraSensitivity: 'Kamera-Empfindlichkeit',
    edgeScroll: 'Karte am Bildschirmrand verschieben',
    saved: 'Einstellungen gespeichert',
  },
  perf: {
    line: (fps: number, simMsPerTick: number, drawCalls: number): string =>
      `${fps.toFixed(0)} Bilder/s · Simulation ${simMsPerTick.toFixed(2)} ms/Schritt · ${drawCalls} Zeichenaufrufe`,
  },
} as const;
