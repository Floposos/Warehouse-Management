import { formatSignedEuro } from '../../shared/format';
import { el } from '../components/dom';

/** Lebensdauer der Anzeige in Millisekunden (passend zur CSS-Animation). */
const LIFETIME_MS = 1600;

/** Schwebende +/−-Beträge an der Stelle des Geschehens; steigen auf und verblassen. */
export class FloatingAmounts {
  private readonly layer = el('div', 'floating-amounts');

  constructor(parent: HTMLElement) {
    this.layer.setAttribute('aria-hidden', 'true');
    parent.append(this.layer);
  }

  spawn(amountCents: number, screenX: number, screenY: number): void {
    const label = el('span', amountCents >= 0 ? 'floating-amount is-income' : 'floating-amount');
    label.dataset['testid'] = 'floating-amount';
    label.textContent = formatSignedEuro(amountCents);
    label.style.left = `${Math.round(screenX)}px`;
    label.style.top = `${Math.round(screenY)}px`;
    this.layer.append(label);
    window.setTimeout(() => label.remove(), LIFETIME_MS);
  }

  clear(): void {
    this.layer.replaceChildren();
  }
}
