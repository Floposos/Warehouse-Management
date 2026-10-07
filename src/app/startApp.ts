import { GameRenderer } from '../render/scene/gameRenderer';
import { BUILD_INFO, formatBuildLabel } from '../shared/buildInfo';
import { el } from '../ui/components/dom';
import { de } from '../ui/texts/de';
import { AppController } from './appController';

/** Pfad des aktuellen ZIP neben der Web-Version (siehe .github/workflows/deploy.yml). */
const DOWNLOAD_PATH = 'download/logistikum-latest.zip';

/** Einstieg: Darstellung anlegen, dann übernimmt der AppController. */
export function startApp(): AppController | null {
  const canvas = document.querySelector<HTMLCanvasElement>('#scene');
  const ui = document.querySelector<HTMLElement>('#ui');
  if (!canvas || !ui) throw new Error('index.html: #scene oder #ui fehlt');

  const version = el('div', 'build-label', formatBuildLabel(BUILD_INFO));
  version.dataset['testid'] = 'build-label';
  ui.append(version);

  let renderer: GameRenderer;
  try {
    renderer = new GameRenderer(canvas);
  } catch {
    ui.append(el('p', 'webgl-error', de.noWebgl));
    return null;
  }
  const isWeb = location.protocol === 'http:' || location.protocol === 'https:';
  return new AppController(ui, canvas, renderer, isWeb ? DOWNLOAD_PATH : null);
}
