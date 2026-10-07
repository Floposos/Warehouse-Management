import { de } from '../texts/de';

export interface PerfSample {
  /** Dauer des letzten Bilds in ms. */
  frameMs: number;
  /** Rechenzeit der Simulation in diesem Bild in ms und Anzahl Schritte. */
  simMs: number;
  simTicks: number;
  drawCalls: number;
}

/**
 * Einblendbare Leistungsanzeige (ANNAHME: Taste F3). Zeigt Bilder/s gemittelt
 * über eine halbe Sekunde, Simulationszeit pro Schritt und Zeichenaufrufe.
 */
export class PerfOverlay {
  private readonly el = document.createElement('div');
  private visible = false;
  private frames = 0;
  private elapsed = 0;
  private simMs = 0;
  private simTicks = 0;

  constructor(root: HTMLElement) {
    this.el.className = 'perf-overlay';
    this.el.dataset['testid'] = 'perf-overlay';
    this.el.hidden = true;
    root.append(this.el);
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'F3') return;
      e.preventDefault();
      this.toggle();
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.el.hidden = !this.visible;
  }

  record(sample: PerfSample): void {
    this.frames += 1;
    this.elapsed += sample.frameMs;
    this.simMs += sample.simMs;
    this.simTicks += sample.simTicks;
    if (this.elapsed < 500) return;
    if (this.visible) {
      const fps = (this.frames * 1000) / this.elapsed;
      const perTick = this.simTicks > 0 ? this.simMs / this.simTicks : 0;
      this.el.textContent = de.perf.line(fps, perTick, sample.drawCalls);
    }
    this.frames = 0;
    this.elapsed = 0;
    this.simMs = 0;
    this.simTicks = 0;
  }
}
