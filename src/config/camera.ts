/** Kamera: Grenzen und Geschwindigkeiten (Bedienung: Entscheidung 07.10.2026, Aufbauspiel-Stil). */
export const cameraConfig = {
  /** Neigung in Grad über dem Boden: flach … senkrecht von oben. Nie unter den Boden. */
  minPitchDeg: 15,
  maxPitchDeg: 85,
  /** Abstand der Kamera zum Blickpunkt in Feldern. */
  minDistance: 8,
  maxDistance: 170,
  /** Startansicht eines neuen Spiels. */
  start: { distance: 60, pitchDeg: 50, yawDeg: 45 },
  /** Maus: Grad pro Pixel beim Drehen/Neigen (rechte Taste). */
  rotateDegPerPixel: 0.3,
  tiltDegPerPixel: 0.2,
  /** Mausrad: Zoomfaktor pro Rad-Schritt (100 Einheiten deltaY). */
  zoomPerWheelStep: 1.15,
  /** Tastatur und Bildschirmrand: Verschiebung in Bildschirmhöhen pro Sekunde. */
  panScreensPerSecond: 0.8,
  /** Tastatur: Drehen (Q/E) und Neigen (R/F) in Grad pro Sekunde, Zoom (+/−) Faktor pro Sekunde. */
  keyRotateDegPerSecond: 90,
  keyTiltDegPerSecond: 45,
  keyZoomPerSecond: 2.5,
  /** Breite des Randstreifens für Rand-Scrollen in Pixeln. */
  edgeScrollPixels: 12,
  /** Hauptmenü: Kreisfahrt in Grad pro Sekunde. */
  menuOrbitDegPerSecond: 4,
} as const;
