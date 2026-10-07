import { button, el } from './dom';

export interface DialogButton {
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}

/** Zählt offene Dialoge, damit z. B. Esc und Tastenkürzel wissen, ob ein Dialog Vorrang hat. */
let openCount = 0;
export function isDialogOpen(): boolean {
  return openCount > 0;
}

/**
 * Modaler Dialog über allem. Esc oder Klick neben den Dialog schließt ihn
 * (ruft `onClose`). Rückgabe: Funktion zum Schließen.
 */
export class Dialog {
  readonly body = el('div', 'dialog-body');
  private readonly backdrop = el('div', 'dialog-backdrop');
  private readonly footer = el('div', 'dialog-footer');
  private closed = false;
  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    e.stopImmediatePropagation();
    e.preventDefault();
    this.close();
  };

  constructor(
    root: HTMLElement,
    title: string,
    private readonly onClose: () => void = () => undefined,
  ) {
    const box = el('div', 'dialog');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', title);
    box.append(el('h2', 'dialog-title', title), this.body, this.footer);
    this.backdrop.append(box);
    this.backdrop.addEventListener('pointerdown', (e) => {
      if (e.target === this.backdrop) this.close();
    });
    root.append(this.backdrop);
    // Capture: Esc schließt zuerst den obersten Dialog, bevor andere Kürzel reagieren.
    window.addEventListener('keydown', this.onKey, true);
    openCount += 1;
  }

  setButtons(buttons: DialogButton[]): void {
    this.footer.replaceChildren(
      ...buttons.map((b) => {
        const cls = ['btn', b.primary ? 'btn-primary' : '', b.danger ? 'btn-danger' : ''];
        return button(b.label, b.onClick, cls.join(' ').trim());
      }),
    );
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    openCount -= 1;
    window.removeEventListener('keydown', this.onKey, true);
    this.backdrop.remove();
    this.onClose();
  }
}
