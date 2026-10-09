/** Lage eines Fahrzeugs in der Welt, aus Route und Fortschritt berechnet (ohne Three.js). */
export interface Pose {
  x: number;
  z: number;
  /** Drehung um die Hochachse; 0 = Fahrt nach Osten (+x). */
  angle: number;
}

/** Abstand der Fahrspur von der Straßenmitte (Rechtsverkehr). */
export const LANE_OFFSET = 0.22;
/** Abseits geparkt: am rechten Straßenrand. */
export const PARKED_OFFSET = 0.42;

/** Fahrtrichtungen wie `DIRS` in der Simulation: Nord, Ost, Süd, West. */
const HEADINGS = [
  { dx: 0, dz: -1 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
] as const;

/**
 * Position auf der Route: `progress` Tausendstel Feld von `route[0]` Richtung `route[1]`,
 * plus `extra` Tausendstel (Vorausschau zwischen zwei Schritten), über Feldgrenzen hinweg.
 * Fahrzeuge fahren rechts: Versatz nach rechts zur Fahrtrichtung. Steht das Fahrzeug am
 * Ende des Wegs, zeigt es in seine letzte Fahrtrichtung (`heading`).
 */
export function vehiclePose(
  route: readonly { x: number; z: number }[],
  progress: number,
  extra = 0,
  heading = 1,
  offset = LANE_OFFSET,
): Pose | null {
  const first = route[0];
  if (!first) return null;
  let index = 0;
  let t = progress + extra;
  while (t >= 1000 && index < route.length - 2) {
    t -= 1000;
    index += 1;
  }
  const a = route[index] ?? first;
  const b = route[index + 1];
  if (!b) {
    const prev = index > 0 ? route[index - 1] : undefined;
    const h = HEADINGS[heading] ?? HEADINGS[1];
    return place(a.x, a.z, prev ? a.x - prev.x : h.dx, prev ? a.z - prev.z : h.dz, 0, offset);
  }
  return place(a.x, a.z, b.x - a.x, b.z - a.z, Math.min(1, t / 1000), offset);
}

function place(cx: number, cz: number, dx: number, dz: number, t: number, offset: number): Pose {
  return {
    x: cx + 0.5 + dx * t - dz * offset,
    z: cz + 0.5 + dz * t + dx * offset,
    angle: Math.atan2(-dz, dx),
  };
}
