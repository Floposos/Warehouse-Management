import { Dialog } from '../components/dialog';
import { button, el } from '../components/dom';
import { de } from '../texts/de';

export interface PauseMenuActions {
  resume(): void;
  save(): void;
  load(): void;
  settings(): void;
  mainMenu(): void;
}

/** Esc-Menü im Spiel. Schließen (Esc, Klick daneben, „Weiterspielen“) setzt das Spiel fort. */
export function openPauseMenu(root: HTMLElement, actions: PauseMenuActions): Dialog {
  let next: (() => void) | null = null;
  const dialog = new Dialog(root, de.pause.title, () => (next ?? actions.resume)());
  const choose = (action: () => void) => () => {
    next = action;
    dialog.close();
  };
  const list = el('div', 'pause-menu');
  list.append(
    button(de.pause.resume, choose(actions.resume), 'btn btn-primary btn-large'),
    button(de.pause.save, choose(actions.save), 'btn btn-large'),
    button(de.pause.load, choose(actions.load), 'btn btn-large'),
    button(de.pause.settings, choose(actions.settings), 'btn btn-large'),
    button(de.pause.mainMenu, choose(actions.mainMenu), 'btn btn-large'),
  );
  dialog.body.append(list);
  return dialog;
}
