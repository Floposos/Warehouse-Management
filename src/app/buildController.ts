import { installBuildPointer } from '../input/buildPointer';
import { previewAt, type BuildPreview, type BuildTool } from '../input/buildTool';
import type { GameRenderer } from '../render/scene/gameRenderer';
import type { Ghost } from '../render/views/ghostView';
import { BuildBar } from '../ui/hud/buildBar';
import { buildTipText } from '../ui/hud/buildTipText';
import { CursorTip } from '../ui/hud/cursorTip';
import { de } from '../ui/texts/de';
import type { GameSession } from './gameSession';

/**
 * Bauwerkzeuge: verbindet Bauleiste, Maus, Vorschau (Geisterbild + Tooltip) und
 * schickt beim Klick den Befehl an die Simulation. Ändert den Zustand nie direkt.
 */
export class BuildController {
  private tool: BuildTool | null = null;
  private pointer: { x: number; y: number } | null = null;
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
      click: (x, y) => this.click(x, y),
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
    this.bar.setTool(tool);
    this.canvas.classList.toggle('is-building', tool !== null);
    if (!tool) this.clearPreview();
  }

  /** Esc: bricht ein aktives Werkzeug ab. Liefert true, wenn etwas abgebrochen wurde. */
  cancel(): boolean {
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
    const { text, kind } = buildTipText(preview);
    this.tip.show(text, de.build.escHint, kind, this.pointer.x, this.pointer.y);
  }

  private previewAt(clientX: number, clientY: number): BuildPreview | null {
    const session = this.session();
    if (!this.tool || !session) return null;
    const ground = this.renderer.pickGround(clientX, clientY);
    return ground ? previewAt(session.state, this.tool, ground.x, ground.z) : null;
  }

  private click(clientX: number, clientY: number): void {
    const preview = this.previewAt(clientX, clientY);
    if (!preview || preview.kind === 'nothingToDemolish') return;
    if (preview.kind === 'place' && preview.reason) return;
    this.session()?.command(preview.command);
  }

  private clearPreview(): void {
    this.renderer.setGhost(null);
    this.tip.hide();
  }
}

function toGhost(preview: BuildPreview): Ghost | null {
  switch (preview.kind) {
    case 'place':
      return {
        footprint: preview.footprint,
        height: preview.height,
        style: preview.reason ? 'invalid' : 'valid',
      };
    case 'demolish':
      return { footprint: preview.footprint, height: preview.height, style: 'demolish' };
    case 'nothingToDemolish':
      return null;
  }
}
