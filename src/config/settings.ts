/** Einstellungen: Standardwerte und erlaubte Werte. */
export const settingsConfig = {
  /** Entscheidung 07.10.2026: Autosave alle 5 Minuten Echtzeit, in den Einstellungen änderbar. */
  autosaveMinutesOptions: [2, 5, 10, 15],
  autosaveMinutesDefault: 5,
  /** Kamera-Empfindlichkeit als Faktor. */
  cameraSensitivityMin: 0.25,
  cameraSensitivityMax: 2.5,
  cameraSensitivityDefault: 1,
  edgeScrollDefault: true,
} as const;
