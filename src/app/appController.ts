import { cameraConfig } from '../config/camera';
import type { GameSpeed } from '../config/time';
import { worldConfig } from '../config/world';
import { CameraInput } from '../input/cameraInput';
import { installGameShortcuts } from '../input/gameShortcuts';
import { createRig, rotate, type CameraRig } from '../render/camera/cameraRig';
import type { GameRenderer } from '../render/scene/gameRenderer';
import { SettingsStore } from '../shared/settings';
import { createInitialState, type GameState } from '../sim/state/gameState';
import { confirmDialog } from '../ui/components/confirm';
import { isDialogOpen } from '../ui/components/dialog';
import { Toasts } from '../ui/components/toast';
import { PerfOverlay } from '../ui/hud/perfOverlay';
import { Topbar } from '../ui/hud/topbar';
import { MainMenu } from '../ui/screens/mainMenu';
import { openPauseMenu } from '../ui/screens/pauseMenu';
import { openSettingsDialog } from '../ui/screens/settingsDialog';
import { de } from '../ui/texts/de';
import { BuildController } from './buildController';
import { startFrameLoop } from './frameLoop';
import { GameSession } from './gameSession';
import { SaveController } from './saveController';

const { campusWidth: W, campusDepth: D } = worldConfig;
const BOUNDS = { minX: 0, maxX: W, minZ: 0, maxZ: D };
/** Startblick eines neuen Spiels: auf die Test-Halle an der Eingangsstraße. */
const START_VIEW = { x: 24, z: 62 };

/**
 * Verbindet alle Schichten und schaltet zwischen Hauptmenü und Spiel um.
 * Im Menü kreist die Kamera über dem Campus, die Simulation steht.
 */
export class AppController {
  readonly settings = new SettingsStore(safeLocalStorage());
  readonly toasts: Toasts;
  session: GameSession | null = null;
  private mode: 'menu' | 'game' = 'menu';
  private readonly menuState = createInitialState(1);
  private readonly menuRig = createRig(W / 2, D / 2);
  private rig: CameraRig = createRig(START_VIEW.x, START_VIEW.z);
  private readonly cameraInput: CameraInput;
  private readonly topbar: Topbar;
  private readonly mainMenu: MainMenu;
  private readonly perf: PerfOverlay;
  readonly build: BuildController;
  readonly saves: SaveController;

  constructor(
    readonly ui: HTMLElement,
    canvas: HTMLCanvasElement,
    private readonly renderer: GameRenderer,
    downloadUrl: string | null,
  ) {
    Object.assign(this.menuRig, { distance: 120, pitchDeg: 32 });
    this.cameraInput = new CameraInput({
      canvas,
      rig: this.rig,
      bounds: BOUNDS,
      sensitivity: () => this.settings.get().cameraSensitivity,
      edgeScroll: () => this.settings.get().edgeScroll,
    });
    this.topbar = new Topbar(ui, {
      setSpeed: (s) => this.setSpeed(s),
      togglePause: () => this.session?.togglePause(),
      openMenu: () => this.openPauseMenu(),
    });
    this.mainMenu = new MainMenu(
      ui,
      {
        newGame: () => {
          this.startGame(createInitialState(randomSeed()));
          this.saves.onGameStarted(null);
        },
        load: () => void this.saves.openLoad(() => undefined),
        settings: () => this.openSettings(),
      },
      downloadUrl,
    );
    this.toasts = new Toasts(ui);
    this.saves = new SaveController({
      ui,
      toasts: this.toasts,
      currentState: () => this.session?.state ?? null,
      startGame: (state) => this.startGame(state),
      autosaveMinutes: () => this.settings.get().autosaveMinutes,
    });
    this.perf = new PerfOverlay(ui);
    this.build = new BuildController(ui, canvas, renderer, () => this.session);
    installGameShortcuts({
      isActive: () => this.mode === 'game' && !isDialogOpen(),
      cancelTool: () => this.build.cancel(),
      togglePause: () => this.session?.togglePause(),
      setSpeed: (s) => this.setSpeed(s),
      openMenu: () => this.openPauseMenu(),
    });
    window.addEventListener('resize', () => renderer.resize());
    this.showMenu();
    startFrameLoop((dt) => this.frame(dt));
    this.startAutosaveClock();
  }

  /** Echtzeit-Uhr für Autosave und Export-Erinnerung (läuft unabhängig von der Bildrate). */
  private startAutosaveClock(): void {
    let last = Date.now();
    setInterval(() => {
      const now = Date.now();
      if (this.session) this.saves.timer.advance(now - last);
      last = now;
    }, 1000);
  }

  /** Aktuelle Spielkamera (für Rauchtests). */
  get cameraRig(): Readonly<CameraRig> {
    return this.rig;
  }

  get inGame(): boolean {
    return this.mode === 'game';
  }

  /** Startet ein Spiel mit dem gegebenen Zustand (neu oder geladen). */
  startGame(state: GameState): void {
    this.session = new GameSession(state);
    Object.assign(this.rig, createRig(START_VIEW.x, START_VIEW.z));
    this.mode = 'game';
    this.mainMenu.visible = false;
    this.topbar.visible = true;
    this.build.visible = true;
    this.cameraInput.enabled = true;
  }

  showMenu(): void {
    this.mode = 'menu';
    this.session = null;
    this.cameraInput.enabled = false;
    this.cameraInput.releaseAll();
    this.mainMenu.visible = true;
    this.topbar.visible = false;
    this.build.visible = false;
  }

  private setSpeed(speed: GameSpeed): void {
    this.session?.setSpeed(speed);
  }

  /** Esc-Menü: pausiert; beim Schließen läuft das Spiel weiter wie vorher. */
  openPauseMenu(): void {
    const session = this.session;
    if (!session || isDialogOpen()) return;
    const wasPaused = session.paused;
    session.pause();
    const resume = (): void => {
      if (!wasPaused) session.resume();
    };
    openPauseMenu(this.ui, {
      resume,
      save: () => void this.saves.openSave(resume),
      load: () => void this.saves.openLoad(resume),
      settings: () => this.openSettings(resume),
      mainMenu: () => void this.confirmLeave(resume),
    });
  }

  private async confirmLeave(onCancel: () => void): Promise<void> {
    const ok = await confirmDialog(
      this.ui,
      de.pause.leaveTitle,
      de.pause.leaveMessage,
      de.pause.leaveConfirm,
    );
    if (ok) this.showMenu();
    else onCancel();
  }

  openSettings(onClose?: () => void): void {
    openSettingsDialog(
      this.ui,
      this.settings.get(),
      (changes) => this.settings.update(changes),
      onClose,
    );
  }

  private frame(dtMs: number): void {
    let simMs = 0;
    let simTicks = 0;
    let state = this.menuState;
    let rig = this.menuRig;
    if (this.session) {
      const result = this.session.frame(dtMs);
      simMs = result.simMs;
      simTicks = result.ticks;
      state = this.session.state;
      rig = this.rig;
      this.cameraInput.update(dtMs / 1000);
      this.topbar.update(state, this.session.speed);
      this.build.update();
    } else {
      rotate(this.menuRig, (cameraConfig.menuOrbitDegPerSecond * dtMs) / 1000);
    }
    this.renderer.syncWorld(state);
    this.renderer.render(rig);
    this.perf.record({ frameMs: dtMs, simMs, simTicks, drawCalls: this.renderer.drawCalls });
  }
}

function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

/** localStorage kann gesperrt sein (z. B. strenge Datenschutz-Einstellungen). */
function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
