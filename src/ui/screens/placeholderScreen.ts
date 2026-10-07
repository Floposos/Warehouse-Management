import { de } from '../texts/de';

export interface PlaceholderScreenOptions {
  buildLabel: string;
  /** Link zum ZIP, nur auf der Web-Version (nicht bei file://). */
  downloadUrl: string | null;
}

/** Overlay über der 3D-Szene: Titel, Hinweis, Version und Download-Link. */
export function mountPlaceholderScreen(root: HTMLElement, options: PlaceholderScreenOptions): void {
  const panel = document.createElement('div');
  panel.className = 'placeholder-panel';

  const title = document.createElement('h1');
  title.textContent = de.title;
  const subtitle = document.createElement('p');
  subtitle.textContent = de.placeholder.subtitle;
  panel.append(title, subtitle);

  if (options.downloadUrl) {
    const link = document.createElement('a');
    link.href = options.downloadUrl;
    link.textContent = de.placeholder.download;
    link.className = 'placeholder-download';
    panel.append(link);
  }

  const version = document.createElement('div');
  version.className = 'build-label';
  version.dataset['testid'] = 'build-label';
  version.textContent = options.buildLabel;

  root.append(panel, version);
}

/** Meldung, falls der Browser kein WebGL kann. */
export function showNoWebglMessage(root: HTMLElement): void {
  const message = document.createElement('p');
  message.className = 'placeholder-error';
  message.textContent = de.placeholder.noWebgl;
  root.append(message);
}
