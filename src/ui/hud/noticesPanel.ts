import { calendarAt } from '../../sim/core/gameTime';
import type { Notice } from '../../sim/events/notices';
import type { GameState } from '../../sim/state/gameState';
import { pad2 } from '../../shared/format';
import { button, el } from '../components/dom';
import { de } from '../texts/de';
import { truckLabel } from './info/names';

/** Text einer Meldung mit dem Namen des Fahrzeugs. */
export function noticeText(state: GameState, notice: Notice): string {
  const v = state.vehicles.find((x) => x.id === notice.vehicleId);
  const who =
    v?.kind === 'truck' ? truckLabel(state, v.id) : v ? de.info.supplier : de.notices.vehicle;
  return de.notices.texts[notice.kind](who);
}

function when(tick: number): string {
  const c = calendarAt(tick);
  return `${de.hud.weekdays[c.weekday] ?? ''} ${pad2(c.hour)}:${pad2(c.minute)}`;
}

/**
 * Meldungsliste (T2.4/T2.6) unter der Kopfleiste, neueste zuerst. Klick auf eine Meldung
 * zeigt den Ort (Kamera springt hin, Fahrzeug wird ausgewählt).
 */
export class NoticesPanel {
  readonly root = el('aside', 'notices-panel');
  private readonly list = el('ul', 'notices-list');
  private key = '';

  constructor(
    parent: HTMLElement,
    private readonly show: (notice: Notice) => void,
  ) {
    this.root.dataset['testid'] = 'notices-panel';
    this.root.setAttribute('aria-label', de.notices.title);
    const close = button('×', () => this.close(), 'btn btn-icon info-close');
    close.title = de.notices.close;
    close.setAttribute('aria-label', de.notices.close);
    const head = el('div', 'info-head');
    head.append(el('h2', 'info-title', de.notices.title), close);
    this.root.append(head, this.list);
    this.root.hidden = true;
    parent.append(this.root);
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  toggle(state: GameState): void {
    this.root.hidden = !this.root.hidden;
    this.key = '';
    this.update(state);
  }

  close(): void {
    this.root.hidden = true;
  }

  update(state: GameState): void {
    if (!this.isOpen) return;
    const key = state.notices.map((n) => n.id).join(',');
    if (key === this.key) return;
    this.key = key;
    if (state.notices.length === 0) {
      this.list.replaceChildren(el('li', 'info-note', de.notices.empty));
      return;
    }
    this.list.replaceChildren(
      ...[...state.notices].reverse().map((n) => {
        const item = button('', () => this.show(n), 'btn notices-item');
        item.append(
          el('span', 'notices-time', when(n.tick)),
          el('span', `notices-text notices-${n.kind}`, noticeText(state, n)),
        );
        const li = el('li');
        li.append(item);
        return li;
      }),
    );
  }
}
