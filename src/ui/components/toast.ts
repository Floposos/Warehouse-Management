import { button, el } from './dom';

export interface ToastOptions {
  /** Anzeigedauer in ms. */
  durationMs?: number;
  action?: { label: string; onClick: () => void };
  kind?: 'info' | 'success' | 'warning';
}

/** Kurze Meldung oben mittig, verschwindet von selbst. */
export class Toasts {
  private readonly container = el('div', 'toasts');

  constructor(root: HTMLElement) {
    this.container.setAttribute('aria-live', 'polite');
    root.append(this.container);
  }

  show(message: string, options: ToastOptions = {}): void {
    const toast = el('div', `toast toast-${options.kind ?? 'info'}`);
    toast.dataset['testid'] = 'toast';
    toast.append(el('span', '', message));
    const remove = (): void => toast.remove();
    if (options.action) {
      const { label, onClick } = options.action;
      toast.append(
        button(label, () => {
          remove();
          onClick();
        }),
      );
    }
    this.container.append(toast);
    setTimeout(remove, options.durationMs ?? 2500);
  }
}
