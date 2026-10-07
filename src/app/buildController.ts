import { installBuildPointer } from '../input/buildPointer';
import {
  isDragTool,
  previewAt,
  ROAD_GHOST_HEIGHT,
  type BuildPreview,
  type BuildTool,
} from '../input/buildTool';
import type { GameRenderer } from '../render/scene/gameRenderer';
import type { Ghost } from '../render/views/ghostView';
import { BuildBar } from '../ui/hud/buildBar';
import { buildTipText } from '../ui/hud/buildTipText';
import { CursorTip } from '../ui/hud/cursorTip';
import { de } from '../ui/texts/de';
import type { Cell } from '../sim/world/roadLine';
import type { GameSession } from './gameSession';

/**
 * Bauwerkzeuge: verbindet Bauleiste, Maus, Vorschau (Geisterbild + Tooltip) und
 * schickt beim Klick den Befehl an die Simulation. Ändert den Zustand nie direkt.
 */
export class BuildController {
  private tool: BuildTool | null = null;
  private pointer: { x: number; y: number } | null = null;
  /** Startfeld beim Ziehen einer Straße. */
  private dragStart: Cell | null = null;
  private readonly bar: BuildBar;
  private readonly tip: CursorTip;

  constructor(
    ui: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly renderer: GameRenderer,
    private readonly session: () => GameSession | null,
  ) {
    this.bar = new BuildBar(ui, (tool) => this.setTool(tool));
    this.tip = new CursorTip(ui);
    installBuildPointer(canvas, {
      move: (x, y) => (this.pointer = { x, y }),
      down: (x, y) => this.down(x, y),
      up: (x, y) => this.up(x, y),
      leave: () => (this.pointer = null),
    });
  }

  set visible(v: boolean) {
    this.bar.visible = v;
    if (!v) this.setTool(null);
  }

  get activeTool(): BuildTool | null {
    return this.tool;
  }

  setTool(tool: BuildTool | null): void {
    this.tool = tool;
    this.dragStart = null;
    this.bar.setTool(tool);
    this.canvas.classList.toggle('is-building', tool !== null);
    if (!tool) this.clearPreview();
  }

  /** Esc: bricht erst ein laufendes Ziehen, dann das Werkzeug ab. True = Esc verbraucht. */
  cancel(): boolean {
    if (this.dragStart) {
      this.dragStart = null;
      return true;
    }
    if (!this.tool) return false;
    this.setTool(null);
    return true;
  }

  /** Pro Bild: Vorschau an der aktuellen Mausposition (Zustand und Kamera ändern sich laufend). */
  update(): void {
    const preview = this.pointer ? this.previewAt(this.pointer.x, this.pointer.y) : null;
    if (!preview || !this.pointer) {
      this.clearPreview();
      return;
    }
    this.renderer.setGhost(toGhost(preview));
    const { text, kind, warning } = buildTipText(preview);
    this.tip.show(text, de.build.escHint, kind, this.pointer.x, this.pointer.y, warning);
  }

  private previewAt(clientX: number, clientY: number): BuildPreview | null {
    const session = this.session();
    if (!this.tool || !session) return null;
    const ground = this.renderer.pickGround(clientX, clientY);
    return ground ? previewAt(session.state, this.tool, ground.x, ground.z, this.dragStart) : null;
  }

  private down(clientX: number, clientY: number): void {
    this.pointer = { x: clientX, y: clientY };
    if (isDragTool(this.tool)) {
      const ground = this.renderer.pickGround(clientX, clientY);
      if (ground) this.dragStart = { x: Math.floor(ground.x), z: Math.floor(ground.z) };
      return;
    }
    this.commit(this.previewAt(clientX, clientY));
  }

  /** Straße und Zone: Loslassen baut die gezogene Strecke bzw. das Rechteck. */
  private up(clientX: number, clientY: number): void {
    if (!isDragTool(this.tool) || !this.dragStart) return;
    const preview = this.previewAt(clientX, clientY);
    this.dragStart = null;
    this.commit(preview);
  }

  private commit(preview: BuildPreview | null): void {
    if (!preview || preview.kind === 'nothingToDemolish') return;
    if ('reason' in preview && preview.reason) return;
    this.session()?.command(preview.command);
  }

  private clearPreview(): void {
    this.renderer.setGhost([]);
    this.tip.hide();
  }
}

function toGhost(preview: BuildPreview): Ghost[] {
  switch (preview.kind) {
    case 'place': {
      const style = preview.reason ? 'invalid' : 'valid';
      return [{ footprint: preview.footprint, height: preview.height, style }];
    }
    case 'road': {
      // Ohne konkretes Hindernis (z. B. Geld fehlt) ist die ganze Strecke rot.
      const blocked = new Set(preview.blocked.map((c) => `${c.x},${c.z}`));
      const allRed = preview.reason !== null && blocked.size === 0;
      return preview.cells.map((c) => ({
        footprint: { x: c.x, z: c.z, width: 1, depth: 1 },
        height: ROAD_GHOST_HEIGHT,
        style: allRed || blocked.has(`${c.x},${c.z}`) ? 'invalid' : 'valid',
      }));
    }
    case 'zone': {
      const style = preview.reason ? 'invalid' : 'valid';
      return [{ footprint: preview.footprint, height: ROAD_GHOST_HEIGHT, style }];
    }
    case 'demolish':
      return [{ footprint: preview.footprint, height: preview.height, style: 'demolish' }];
    case 'nothingToDemolish':
      return [];
  }
}
