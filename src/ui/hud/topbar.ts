import { isRushHour } from '../../sim/traffic/entrance';
import { timeConfig, type GameSpeed } from '../../config/time';
import { formatEuro } from '../../shared/format';
import { calendarAt } from '../../sim/core/gameTime';
import type { GameState } from '../../sim/state/gameState';
import { button, el } from '../components/dom';
import { de } from '../texts/de';
import { formatClock } from './clockLabel';

export interface TopbarActions {
  setSpeed(speed: GameSpeed): void;
  togglePause(): void;
  openMenu(): void;
  openCash(): void;
  openPurchase(): void;
  openTours(): void;
  openNotices(): void;
}

/** Kopfleiste: Datum/Uhrzeit, Kontostand, Zeitsteuerung, Menü. Liest nur den Zustand. */
export class Topbar {
  readonly root = el('div', 'topbar');
  private readonly clock = el('span', 'topbar-clock');
  private readonly balance: HTMLButtonElement;
  private readonly pauseBadge = el('span', 'topbar-paused', de.hud.paused);
  private readonly rushBadge = el('span', 'topbar-rush', de.entrance.rush);
  private readonly pauseButton: HTMLButtonElement;
  private readonly speedButtons = new Map<GameSpeed, HTMLButtonElement>();
  private readonly notices: HTMLButtonElement;
  private lastNotices = -1;
  private lastClock = '';
  private lastBalance = '';

  constructor(parent: HTMLElement, actions: TopbarActions) {
    this.clock.dataset['testid'] = 'clock';
    this.balance = button('', () => actions.openCash(), 'btn topbar-balance-button');
    this.balance.dataset['testid'] = 'balance';
    this.balance.title = de.hud.balanceTitle;
    this.pauseBadge.hidden = true;
    this.rushBadge.hidden = true;
    this.rushBadge.title = de.entrance.rushTitle;
    this.rushBadge.dataset['testid'] = 'rush-badge';

    const controls = el('div', 'topbar-speed');
    this.pauseButton = button('⏸', () => actions.togglePause(), 'btn btn-icon');
    this.pauseButton.title = de.hud.pauseTitle;
    this.pauseButton.setAttribute('aria-label', de.hud.pause);
    controls.append(this.pauseButton);
    timeConfig.speeds.forEach((speed, index) => {
      const b = button(de.hud.speed(speed), () => actions.setSpeed(speed), 'btn btn-icon');
      b.title = de.hud.speedTitle(speed, index + 1);
      this.speedButtons.set(speed, b);
      controls.append(b);
    });

    const purchase = button(de.hud.purchase, () => actions.openPurchase());
    purchase.title = de.purchase.openTitle;
    const tours = button(de.tours.open, () => actions.openTours());
    tours.title = de.tours.openTitle;
    this.notices = button(de.notices.open, () => actions.openNotices());
    this.notices.title = de.notices.openTitle;
    this.notices.dataset['testid'] = 'notices-button';
    const menu = button(de.hud.menu, () => actions.openMenu());
    menu.title = de.hud.menuTitle;
    this.root.append(
      this.clock,
      this.rushBadge,
      this.pauseBadge,
      controls,
      this.balance,
      purchase,
      tours,
      this.notices,
      menu,
    );
    parent.append(this.root);
  }

  /** Pro Bild aufrufen; schreibt nur, wenn sich die Anzeige ändert. */
  update(state: GameState, speed: GameSpeed | 0): void {
    const clock = formatClock(calendarAt(state.tick));
    if (clock !== this.lastClock) {
      this.clock.textContent = this.lastClock = clock;
      this.rushBadge.hidden = !isRushHour(state.tick);
    }
    const balance = formatEuro(state.finance.balanceCents);
    if (balance !== this.lastBalance) this.balance.textContent = this.lastBalance = balance;
    this.showSpeed(speed);
  }

  /** Zahl ungelesener Meldungen am Knopf „Meldungen“. */
  setUnread(n: number): void {
    if (n === this.lastNotices) return;
    this.lastNotices = n;
    this.notices.textContent = n > 0 ? de.notices.openCount(n) : de.notices.open;
    this.notices.classList.toggle('has-unread', n > 0);
  }

  private showSpeed(speed: GameSpeed | 0): void {
    const paused = speed === 0;
    this.pauseBadge.hidden = !paused;
    this.root.classList.toggle('is-paused', paused);
    this.pauseButton.classList.toggle('is-active', paused);
    this.pauseButton.setAttribute('aria-pressed', String(paused));
    for (const [s, b] of this.speedButtons) {
      b.classList.toggle('is-active', s === speed);
      b.setAttribute('aria-pressed', String(s === speed));
    }
  }

  set visible(value: boolean) {
    this.root.hidden = !value;
  }
}
