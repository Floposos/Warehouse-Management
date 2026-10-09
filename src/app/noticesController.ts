import type { Notice } from '../sim/events/notices';
import type { Toasts } from '../ui/components/toast';
import { NoticesPanel, noticeText } from '../ui/hud/noticesPanel';
import { de } from '../ui/texts/de';
import type { GameSession } from './gameSession';

/**
 * Meldungen (T2.4/T2.6): Liste unter der Kopfleiste, kurzer Hinweis bei jeder neuen Meldung
 * mit „Hinzeigen“, Zähler ungelesener Meldungen für die Kopfleiste.
 */
export class NoticesController {
  readonly panel: NoticesPanel;
  private detach: (() => void) | null = null;
  private seenId = 0;
  private session: GameSession | null = null;

  constructor(
    ui: HTMLElement,
    private readonly toasts: Toasts,
    private readonly showNotice: (notice: Notice) => void,
  ) {
    this.panel = new NoticesPanel(ui, (n) => this.showNotice(n));
  }

  attach(session: GameSession | null): void {
    this.detach?.();
    this.detach = null;
    this.session = session;
    this.panel.close();
    this.seenId = session?.state.notices.at(-1)?.id ?? 0;
    if (!session) return;
    this.detach = session.sim.bus.on('notice/added', ({ notice }) => {
      this.toasts.show(noticeText(session.state, notice), {
        kind: 'warning',
        durationMs: 5000,
        action: { label: de.notices.show, onClick: () => this.showNotice(notice) },
      });
    });
  }

  /** Esc: Liste schließen, wenn offen. True = verbraucht. */
  close(): boolean {
    if (!this.panel.isOpen) return false;
    this.panel.close();
    return true;
  }

  toggle(): void {
    if (!this.session) return;
    this.panel.toggle(this.session.state);
    this.markSeen();
  }

  /** Ungelesene Meldungen (seit dem letzten Öffnen der Liste). */
  unread(): number {
    if (this.panel.isOpen) this.markSeen();
    return this.session?.state.notices.filter((n) => n.id > this.seenId).length ?? 0;
  }

  update(): void {
    if (this.session) this.panel.update(this.session.state);
  }

  private markSeen(): void {
    this.seenId = this.session?.state.notices.at(-1)?.id ?? this.seenId;
  }
}
