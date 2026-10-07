import type { GameSpeed } from '../config/time';

export interface ShortcutActions {
  /** False im Hauptmenü oder solange ein Dialog offen ist. */
  isActive(): boolean;
  togglePause(): void;
  setSpeed(speed: GameSpeed): void;
  openMenu(): void;
}

const SPEED_KEYS: Record<string, GameSpeed> = {
  Digit1: 1,
  Digit2: 2,
  Digit3: 4,
  Numpad1: 1,
  Numpad2: 2,
  Numpad3: 4,
};

/** Tastenkürzel im Spiel: Leertaste = Pause/Weiter, 1/2/3 = 1x/2x/4x, Esc = Menü. */
export function installGameShortcuts(actions: ShortcutActions): () => void {
  const onKey = (e: KeyboardEvent): void => {
    if (!actions.isActive() || e.repeat) return;
    const target = e.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    const speed = SPEED_KEYS[e.code];
    if (e.code === 'Space') {
      e.preventDefault();
      actions.togglePause();
    } else if (speed !== undefined) {
      actions.setSpeed(speed);
    } else if (e.code === 'Escape') {
      e.preventDefault();
      actions.openMenu();
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
