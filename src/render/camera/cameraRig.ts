import { cameraConfig } from '../../config/camera';

/**
 * Kamera als einfache Zahlen (ohne Three.js, gut testbar): Blickpunkt am Boden,
 * Abstand, Drehung (yaw) und Neigung (pitch, Grad über dem Boden).
 */
export interface CameraRig {
  targetX: number;
  targetZ: number;
  distance: number;
  yawDeg: number;
  pitchDeg: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const DEG = Math.PI / 180;

export function createRig(targetX: number, targetZ: number): CameraRig {
  const { distance, pitchDeg, yawDeg } = cameraConfig.start;
  return { targetX, targetZ, distance, yawDeg, pitchDeg };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function rotate(rig: CameraRig, deltaDeg: number): void {
  rig.yawDeg = (((rig.yawDeg + deltaDeg) % 360) + 360) % 360;
}

export function tilt(rig: CameraRig, deltaDeg: number): void {
  rig.pitchDeg = clamp(rig.pitchDeg + deltaDeg, cameraConfig.minPitchDeg, cameraConfig.maxPitchDeg);
}

/** factor > 1 zoomt heraus, < 1 hinein. */
export function zoom(rig: CameraRig, factor: number): void {
  rig.distance = clamp(rig.distance * factor, cameraConfig.minDistance, cameraConfig.maxDistance);
}

/**
 * Verschiebt den Blickpunkt relativ zur Blickrichtung: `right` nach rechts,
 * `forward` vom Betrachter weg (in Feldern). Bleibt in den Geländegrenzen.
 */
export function pan(rig: CameraRig, right: number, forward: number, bounds: Bounds): void {
  const yaw = rig.yawDeg * DEG;
  // Blickrichtung am Boden: von der Kamera zum Blickpunkt.
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = -fz;
  const rz = fx;
  rig.targetX = clamp(rig.targetX + rx * right + fx * forward, bounds.minX, bounds.maxX);
  rig.targetZ = clamp(rig.targetZ + rz * right + fz * forward, bounds.minZ, bounds.maxZ);
}

/** Position der Kamera im Raum. y ist immer > 0, weil die Neigung mindestens minPitchDeg ist. */
export function cameraPosition(rig: CameraRig): { x: number; y: number; z: number } {
  const yaw = rig.yawDeg * DEG;
  const pitch = rig.pitchDeg * DEG;
  const ground = rig.distance * Math.cos(pitch);
  return {
    x: rig.targetX + ground * Math.sin(yaw),
    y: rig.distance * Math.sin(pitch),
    z: rig.targetZ + ground * Math.cos(yaw),
  };
}
