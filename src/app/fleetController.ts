import { FleetPanel } from '../ui/hud/fleet/fleetPanel';
import type { GameSession } from './gameSession';

/** So oft (ms) aktualisiert sich die Liste höchstens; bei 300 Fahrzeugen schont das den Takt. */
const REFRESH_MS = 250;

/** Flottenfenster (T2.8): öffnen, schließen, gedrosselt aktualisieren. */
export class FleetController {
  readonly panel: FleetPanel;
  private lastUpdate = -Infinity;

  constructor(
    ui: HTMLElement,
    private readonly session: () => GameSession | null,
    show: (vehicleId: number) => void,
  ) {
    this.panel = new FleetPanel(
      ui,
      (c) => this.session()?.command(c) ?? { ok: false, reason: 'noSession' },
      show,
    );
  }

  toggle(): void {
    const session = this.session();
    if (!session) return;
    if (this.panel.isOpen) this.panel.close();
    else this.panel.open(session.state);
  }

  /** Esc: schließen, wenn offen. True = verbraucht. */
  close(): boolean {
    if (!this.panel.isOpen) return false;
    this.panel.close();
    return true;
  }

  update(now: number): void {
    const session = this.session();
    if (!session || !this.panel.isOpen || now - this.lastUpdate < REFRESH_MS) return;
    this.lastUpdate = now;
    this.panel.update(session.state);
  }
}
