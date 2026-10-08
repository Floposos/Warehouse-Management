import { describe, expect, it } from 'vitest';
import { loadWorld } from './loadWorld';

/**
 * Lasttest (T2.9, Entscheidung 08.10.2026: ausgelegt auf 300 Fahrzeuge). Ziel aus dem M2-Plan:
 * ein Simulationsschritt im Mittel unter 4 ms, auch wenn fast alle Fahrzeuge fahren.
 */
describe('Last mit 300 Fahrzeugen', () => {
  it('Simulationsschritt im Mittel unter 4 ms', () => {
    const s = loadWorld(300);
    for (let i = 0; i < 300; i++) s.step();
    const steps = 1500;
    const start = performance.now();
    for (let i = 0; i < steps; i++) s.step();
    const msPerStep = (performance.now() - start) / steps;
    const moving = s.state.vehicles.filter((v) => v.phase.startsWith('to')).length;
    expect(s.state.vehicles.filter((v) => v.kind === 'truck')).toHaveLength(300);
    expect(moving).toBeGreaterThan(150);
    expect(msPerStep).toBeLessThan(4);
  });
});
