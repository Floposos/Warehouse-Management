import { describe, expect, it } from 'vitest';
import { cameraConfig } from '../../config/camera';
import { cameraPosition, createRig, pan, rotate, tilt, zoom } from './cameraRig';

const bounds = { minX: 0, maxX: 128, minZ: 0, maxZ: 128 };

describe('cameraRig', () => {
  it('neigt nur innerhalb der Grenzen, nie unter den Boden', () => {
    const rig = createRig(64, 64);
    tilt(rig, -1000);
    expect(rig.pitchDeg).toBe(cameraConfig.minPitchDeg);
    expect(cameraPosition(rig).y).toBeGreaterThan(0);
    tilt(rig, 1000);
    expect(rig.pitchDeg).toBe(cameraConfig.maxPitchDeg);
  });

  it('zoomt nur innerhalb der Grenzen', () => {
    const rig = createRig(64, 64);
    zoom(rig, 1000);
    expect(rig.distance).toBe(cameraConfig.maxDistance);
    zoom(rig, 0.0001);
    expect(rig.distance).toBe(cameraConfig.minDistance);
  });

  it('dreht im Kreis (0–360 Grad)', () => {
    const rig = createRig(64, 64);
    rig.yawDeg = 350;
    rotate(rig, 20);
    expect(rig.yawDeg).toBeCloseTo(10);
    rotate(rig, -30);
    expect(rig.yawDeg).toBeCloseTo(340);
  });

  it('verschiebt relativ zur Blickrichtung', () => {
    const rig = createRig(64, 64);
    rig.yawDeg = 0; // Kamera steht in +z und schaut Richtung −z
    pan(rig, 0, 10, bounds);
    expect(rig.targetZ).toBeCloseTo(54);
    expect(rig.targetX).toBeCloseTo(64);
    pan(rig, 5, 0, bounds);
    expect(rig.targetX).toBeCloseTo(69);
  });

  it('bleibt beim Verschieben im Gelände', () => {
    const rig = createRig(64, 64);
    pan(rig, 1000, 1000, bounds);
    expect(rig.targetX).toBeGreaterThanOrEqual(0);
    expect(rig.targetX).toBeLessThanOrEqual(128);
    expect(rig.targetZ).toBeGreaterThanOrEqual(0);
    expect(rig.targetZ).toBeLessThanOrEqual(128);
  });

  it('setzt die Kamera auf die gewünschte Entfernung zum Blickpunkt', () => {
    const rig = createRig(10, 20);
    const p = cameraPosition(rig);
    const d = Math.hypot(p.x - 10, p.y, p.z - 20);
    expect(d).toBeCloseTo(rig.distance);
  });
});
