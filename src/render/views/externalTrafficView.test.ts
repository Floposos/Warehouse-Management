import { describe, expect, it } from 'vitest';
import { entranceConfig } from '../../config/entrance';
import { TICKS_PER_DAY } from '../../sim/core/gameTime';
import { externalCarCount, externalCarZ } from './externalTrafficView';

const hour = (h: number): number => (h * TICKS_PER_DAY) / 24;

describe('Externer Verkehr (T2.7, nur Darstellung)', () => {
  it('nachts wenige Autos, in der Rushhour viele', () => {
    expect(externalCarCount(hour(3))).toBe(entranceConfig.externalCars);
    expect(externalCarCount(hour(8))).toBe(entranceConfig.externalCarsRush);
    expect(externalCarCount(hour(17))).toBe(entranceConfig.externalCarsRush);
  });

  it('Lage hängt nur von der Zeit ab und bewegt sich gegenläufig', () => {
    expect(externalCarZ(3, 0, 1234.5)).toBe(externalCarZ(3, 0, 1234.5));
    const a = externalCarZ(0, 0, 10);
    const b = externalCarZ(0, 1, 10);
    expect(externalCarZ(0, 0, 11) - a).toBeCloseTo(0.35);
    expect(externalCarZ(0, 1, 11) - b).toBeCloseTo(-0.35);
  });
});
