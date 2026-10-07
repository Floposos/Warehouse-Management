import { button, el } from '../components/dom';
import { de } from '../texts/de';

export interface MainMenuActions {
  newGame(): void;
  load(): void;
  settings(): void;
}

/** Hauptmenü links über dem lebenden Campus (Entscheidung 07.10.2026). */
export class MainMenu {
  readonly root = el('div', 'main-menu');

  constructor(parent: HTMLElement, actions: MainMenuActions, downloadUrl: string | null) {
    this.root.append(el('h1', 'main-menu-title', de.title), el('p', 'main-menu-sub', de.subtitle));
    const nav = el('nav', 'main-menu-buttons');
    nav.append(
      button(de.menu.newGame, () => actions.newGame(), 'btn btn-primary btn-large'),
      button(de.menu.load, () => actions.load(), 'btn btn-large'),
      button(de.menu.settings, () => actions.settings(), 'btn btn-large'),
    );
    this.root.append(nav);
    if (downloadUrl) {
      const link = el('a', 'main-menu-download', de.menu.download);
      link.href = downloadUrl;
      link.title = de.menu.downloadHint;
      this.root.append(link);
    }
    parent.append(this.root);
  }

  set visible(value: boolean) {
    this.root.hidden = !value;
  }
}
