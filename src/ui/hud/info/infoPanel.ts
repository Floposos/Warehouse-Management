import type { GameState } from '../../../sim/state/gameState';
import { button, el } from '../../components/dom';
import { de } from '../../texts/de';

/** Inhalt des Infofensters; `update` liefert false, wenn das Objekt nicht mehr existiert. */
export interface InfoContent {
  readonly root: HTMLElement;
  update(state: GameState): { title: string } | null;
}

/** Infofenster rechts für das angeklickte Objekt. Zeigt an und schickt nur Befehle. */
export class InfoPanel {
  readonly root = el('aside', 'info-panel');
  private readonly title = el('h2', 'info-title');
  private readonly body = el('div', 'info-body');
  private content: InfoContent | null = null;

  constructor(
    parent: HTMLElement,
    private readonly onClose: () => void,
  ) {
    this.root.dataset['testid'] = 'info-panel';
    const close = button('×', () => this.onClose(), 'btn btn-icon info-close');
    close.title = de.info.close;
    close.setAttribute('aria-label', de.info.close);
    const head = el('div', 'info-head');
    head.append(this.title, close);
    this.root.append(head, this.body);
    this.root.hidden = true;
    parent.append(this.root);
  }

  get isOpen(): boolean {
    return this.content !== null;
  }

  /** Zeigt neuen Inhalt; false, wenn das Objekt schon weg ist. */
  show(content: InfoContent, state: GameState): boolean {
    this.content = content;
    this.body.replaceChildren(content.root);
    this.root.hidden = false;
    return this.update(state);
  }

  /** Aktualisiert die Anzeige; false = Objekt verschwunden, Fenster ist zu. */
  update(state: GameState): boolean {
    const info = this.content?.update(state);
    if (!info) {
      this.hide();
      return false;
    }
    this.title.textContent = info.title;
    this.root.setAttribute('aria-label', info.title);
    return true;
  }

  hide(): void {
    this.content = null;
    this.body.replaceChildren();
    this.root.hidden = true;
  }
}

/** Zeile „Bezeichnung: Wert“. */
export function row(label: string): { root: HTMLElement; value: HTMLElement } {
  const root = el('div', 'info-row');
  const value = el('span', 'info-value');
  root.append(el('span', 'info-label', label), value);
  return { root, value };
}
