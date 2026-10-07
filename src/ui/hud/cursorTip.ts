import { el } from '../components/dom';

/** Kleiner Hinweis am Mauszeiger (Kosten oder Grund, warum nicht gebaut werden kann). */
export class CursorTip {
  private readonly root = el('div', 'cursor-tip');
  private readonly main = el('span', 'cursor-tip-main');
  private readonly hint = el('span', 'cursor-tip-hint');

  constructor(parent: HTMLElement) {
    this.root.dataset['testid'] = 'cursor-tip';
    this.root.hidden = true;
    this.root.append(this.main, this.hint);
    parent.append(this.root);
  }

  show(text: string, hint: string, kind: 'ok' | 'error', x: number, y: number): void {
    this.main.textContent = text;
    this.hint.textContent = hint;
    this.root.classList.toggle('is-error', kind === 'error');
    this.root.style.transform = `translate(${Math.round(x + 18)}px, ${Math.round(y + 18)}px)`;
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }
}
