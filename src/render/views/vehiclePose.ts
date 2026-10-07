/** Lage eines Fahrzeugs in der Welt, aus Route und Fortschritt berechnet (ohne Three.js). */
export interface Pose {
  x: number;
  z: number;
  /** Drehung um die Hochachse; 0 = Fahrt nach Osten (+x). */
  angle: number;
}

/** Abstand der Fahrspur von der Straßenmitte (Rechtsverkehr). */
export const LANE_OFFSET = 0.22;

/**
 * Position auf der Route: `progress` Tausendstel Feld von `route[0]` Richtung `route[1]`,
 * plus `extra` Tausendstel (Vorausschau zwischen zwei Schritten), über Feldgrenzen hinweg.
 * Fahrzeuge fahren rechts: Versatz nach rechts zur Fahrtrichtung.
 */
export function vehiclePose(
  route: readonly { x: number; z: number }[],
  progress: number,
  extra = 0,
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
    const prev = route[index - 1];
    const dx = prev ? a.x - prev.x : 1;
    const dz = prev ? a.z - prev.z : 0;
    return place(a.x, a.z, dx, dz, 0);
  }
  return place(a.x, a.z, b.x - a.x, b.z - a.z, Math.min(1, t / 1000));
}

function place(cx: number, cz: number, dx: number, dz: number, t: number): Pose {
  return {
    x: cx + 0.5 + dx * t - dz * LANE_OFFSET,
    z: cz + 0.5 + dz * t + dx * LANE_OFFSET,
    angle: Math.atan2(-dz, dx),
  };
}
