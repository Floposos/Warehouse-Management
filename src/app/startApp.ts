import { createPlaceholderScene } from '../render/scene/createPlaceholderScene';
import { BUILD_INFO, formatBuildLabel } from '../shared/buildInfo';
import { mountPlaceholderScreen, showNoWebglMessage } from '../ui/screens/placeholderScreen';

/** Pfad des aktuellen ZIP neben der Web-Version (siehe .github/workflows/deploy.yml). */
const DOWNLOAD_PATH = 'download/logistikum-latest.zip';

/** Verbindet Darstellung und Oberfläche. Wird in M0 durch Hauptmenü und Spielschleife ersetzt. */
export function startApp(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#scene');
  const ui = document.querySelector<HTMLElement>('#ui');
  if (!canvas || !ui) throw new Error('index.html: #scene oder #ui fehlt');

  const isWeb = location.protocol === 'http:' || location.protocol === 'https:';
  mountPlaceholderScreen(ui, {
    buildLabel: formatBuildLabel(BUILD_INFO),
    downloadUrl: isWeb ? DOWNLOAD_PATH : null,
  });

  try {
    createPlaceholderScene(canvas);
  } catch {
    showNoWebglMessage(ui);
  }
}
