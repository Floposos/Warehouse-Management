import type { GameRenderer } from '../render/scene/gameRenderer';
import type { SimEventOf } from '../sim/core/events';
import { FloatingAmounts } from '../ui/hud/floatingAmounts';
import type { GameSession } from './gameSession';

/** Höhe über dem Boden, an der schwebende Beträge erscheinen (Felder). */
const FLOAT_HEIGHT = 2;

/** Zeigt Buchungen mit Ort als schwebende +/−-Beträge (T1.6). */
export class FinanceFeedback {
  private readonly amounts: FloatingAmounts;
  private detach: (() => void) | null = null;

  constructor(
    ui: HTMLElement,
    private readonly renderer: GameRenderer,
  ) {
    this.amounts = new FloatingAmounts(ui);
  }

  /** Hört auf die Buchungen eines Spiels; ein vorheriges Spiel wird abgemeldet. */
  attach(session: GameSession | null): void {
    this.detach?.();
    this.detach = null;
    this.amounts.clear();
    if (session) this.detach = session.sim.bus.on('finance/booked', (e) => this.show(e));
  }

  private show(event: SimEventOf<'finance/booked'>): void {
    if (!event.at) return;
    const screen = this.renderer.projectToScreen(event.at.x, FLOAT_HEIGHT, event.at.z);
    if (screen) this.amounts.spawn(event.amountCents, screen.x, screen.y);
  }
}
