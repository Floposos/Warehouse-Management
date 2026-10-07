import { timeConfig } from '../../config/time';
import { REAL_MS_PER_TICK } from './gameTime';

/**
 * Wandelt vergangene Echtzeit in feste Simulationsschritte um (Fixed Timestep).
 * Die Geschwindigkeit multipliziert die Zeit; 0 = Pause. Überschüssige Zeit
 * bleibt im Speicher (`accumulatorMs`) und wird im nächsten Bild verrechnet.
 */
export class StepClock {
  private accumulatorMs = 0;

  constructor(private readonly maxTicksPerFrame: number = timeConfig.maxTicksPerFrame) {}

  /** Liefert die Anzahl fälliger Schritte für `realMs` Echtzeit bei `speed`. */
  advance(realMs: number, speed: number): number {
    if (speed <= 0 || realMs <= 0) return 0;
    this.accumulatorMs += realMs * speed;
    // Kleiner Zuschlag gegen Rundungsfehler (60 × 16,67 ms sollen genau 1000 ms ergeben).
    let ticks = Math.floor((this.accumulatorMs + 1e-6) / REAL_MS_PER_TICK);
    this.accumulatorMs = Math.max(0, this.accumulatorMs - ticks * REAL_MS_PER_TICK);
    if (ticks > this.maxTicksPerFrame) {
      // Nach einem Ruckler nicht alles nachholen, sonst friert das Spiel ein.
      ticks = this.maxTicksPerFrame;
      this.accumulatorMs = 0;
    }
    return ticks;
  }

  /** Anteil (0–1) bis zum nächsten Schritt, für flüssige Darstellung zwischen zwei Schritten. */
  get alpha(): number {
    return this.accumulatorMs / REAL_MS_PER_TICK;
  }

  reset(): void {
    this.accumulatorMs = 0;
  }
}
