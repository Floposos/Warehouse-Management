import { worldConfig } from '../config/world';
import { CameraInput } from '../input/cameraInput';
import { createRig } from '../render/camera/cameraRig';
import { GameRenderer } from '../render/scene/gameRenderer';
import { createInitialState } from '../sim/state/gameState';
import { BUILD_INFO, formatBuildLabel } from '../shared/buildInfo';
import { PerfOverlay } from '../ui/hud/perfOverlay';
import { mountPlaceholderScreen, showNoWebglMessage } from '../ui/screens/placeholderScreen';
import { startFrameLoop } from './frameLoop';

/** Pfad des aktuellen ZIP neben der Web-Version (siehe .github/workflows/deploy.yml). */
const DOWNLOAD_PATH = 'download/logistikum-latest.zip';

/** Verbindet Darstellung, Eingabe und Oberfläche. T0.5 ergänzt Hauptmenü und Spielschleife. */
export function startApp(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#scene');
  const ui = document.querySelector<HTMLElement>('#ui');
  if (!canvas || !ui) throw new Error('index.html: #scene oder #ui fehlt');

  const isWeb = location.protocol === 'http:' || location.protocol === 'https:';
  mountPlaceholderScreen(ui, {
    buildLabel: formatBuildLabel(BUILD_INFO),
    downloadUrl: isWeb ? DOWNLOAD_PATH : null,
  });

  let renderer: GameRenderer;
  try {
    renderer = new GameRenderer(canvas);
  } catch {
    showNoWebglMessage(ui);
    return;
  }
  const state = createInitialState(1);
  renderer.syncBuildings(state.buildings);

  const { campusWidth: w, campusDepth: d } = worldConfig;
  const rig = createRig(24, 62);
  const input = new CameraInput({
    canvas,
    rig,
    bounds: { minX: 0, maxX: w, minZ: 0, maxZ: d },
    sensitivity: () => 1,
    edgeScroll: () => true,
  });
  input.enabled = true;
  const perf = new PerfOverlay(ui);
  window.addEventListener('resize', () => renderer.resize());

  startFrameLoop((dtMs) => {
    input.update(dtMs / 1000);
    renderer.render(rig);
    perf.record({ frameMs: dtMs, simMs: 0, simTicks: 0, drawCalls: renderer.drawCalls });
  });
}
