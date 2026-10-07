import { installBuildPointer } from '../input/buildPointer';
import { pickEntity, type Selection } from '../input/pickEntity';
import type { GameRenderer } from '../render/scene/gameRenderer';
import type { Command, CommandResult } from '../sim/commands/commands';
import type { GameState } from '../sim/state/gameState';
import { CursorTip } from '../ui/hud/cursorTip';
import { InfoPanel, type InfoContent } from '../ui/hud/info/infoPanel';
import { siteLabel, truckLabel } from '../ui/hud/info/names';
import { buildingInfo, zoneInfo } from '../ui/hud/info/siteInfo';
import type { TourEditor } from '../ui/hud/info/tourEditor';
import { supplierInfo, truckInfo } from '../ui/hud/info/vehicleInfo';
import { de } from '../ui/texts/de';
import type { GameSession } from './gameSession';

/** Mausweg in Pixeln, bis der ein Klick nicht mehr als Klick gilt. */
const CLICK_SLOP = 6;
const REFRESH_MS = 250;

/**
 * Auswählen und Infofenster (T1.7): Linksklick ohne Bauwerkzeug wählt Zone, Gebäude oder
 * Fahrzeug; Überfahren zeigt den Namen. Für Touren: „Orte anklicken“ hängt Halte an.
 */
export class SelectionController {
  private selection: Selection | null = null;
  private readonly panel: InfoPanel;
  private readonly hoverTip: CursorTip;
  private editor: TourEditor | null = null;
  private pickingStops = false;
  private pointer: { x: number; y: number } | null = null;
  private downAt: { x: number; y: number } | null = null;
  private lastRefresh = 0;

  constructor(
    ui: HTMLElement,
    canvas: HTMLCanvasElement,
    private readonly renderer: GameRenderer,
    private readonly session: () => GameSession | null,
    private readonly isBuilding: () => boolean,
  ) {
    this.panel = new InfoPanel(ui, () => this.select(null));
    this.hoverTip = new CursorTip(ui, 'hover-tip');
    installBuildPointer(canvas, {
      move: (x, y) => (this.pointer = { x, y }),
      down: (x, y) => (this.downAt = { x, y }),
      up: (x, y) => this.up(x, y),
      leave: () => (this.pointer = null),
    });
  }

  get selected(): Selection | null {
    return this.selection;
  }

  /** Esc: erst „Orte anklicken“ beenden, dann das Infofenster schließen. True = verbraucht. */
  cancel(): boolean {
    if (this.pickingStops) {
      this.pickingStops = false;
      this.refresh();
      return true;
    }
    if (!this.selection) return false;
    this.select(null);
    return true;
  }

  select(selection: Selection | null): void {
    const session = this.session();
    this.selection = selection;
    this.pickingStops = false;
    this.editor = null;
    if (!selection || !session) {
      this.panel.hide();
      this.renderer.setRouteLine(null, null);
      return;
    }
    const content = this.contentFor(selection, session.state);
    if (!content || !this.panel.show(content, session.state)) this.selection = null;
  }

  /** Pro Bild: Hinweis beim Überfahren, Fahrweg, Infofenster regelmäßig auffrischen. */
  update(now: number): void {
    const session = this.session();
    if (!session) return;
    this.updateHover(session.state);
    const vehicleId = this.selection?.kind === 'vehicle' ? this.selection.id : null;
    this.renderer.setRouteLine(vehicleId, session.state);
    if (now - this.lastRefresh >= REFRESH_MS) {
      this.lastRefresh = now;
      this.refresh();
    }
  }

  private refresh(): void {
    const session = this.session();
    if (this.selection && session && !this.panel.update(session.state)) this.select(null);
  }

  private contentFor(selection: Selection, state: GameState): InfoContent | null {
    const submit = (c: Command): CommandResult =>
      this.session()?.command(c) ?? { ok: false, reason: 'noSession' };
    switch (selection.kind) {
      case 'zone':
        return zoneInfo(selection.id, (c) => {
          submit(c);
          this.refresh();
        });
      case 'building':
        return buildingInfo(selection.id);
      case 'vehicle': {
        const v = state.vehicles.find((x) => x.id === selection.id);
        if (v?.kind === 'supplier') return supplierInfo(v.id);
        const info = truckInfo(
          selection.id,
          (c) => {
            const result = submit(c);
            this.refresh();
            return result;
          },
          {
            active: () => this.pickingStops,
            toggle: () => {
              this.pickingStops = !this.pickingStops;
              this.refresh();
            },
          },
        );
        this.editor = info.editor;
        return info;
      }
    }
  }

  private up(x: number, y: number): void {
    const start = this.downAt;
    this.downAt = null;
    if (!start || this.isBuilding() || Math.hypot(x - start.x, y - start.y) > CLICK_SLOP) return;
    const session = this.session();
    const ground = this.renderer.pickGround(x, y);
    if (!session || !ground) return;
    const hit = pickEntity(session.state, ground.x, ground.z);
    if (this.pickingStops && this.editor) {
      if (hit && hit.kind !== 'vehicle') this.editor.add(hit.id);
      return;
    }
    this.select(hit);
  }

  private updateHover(state: GameState): void {
    const ground =
      this.pointer && !this.isBuilding() && !this.downAt
        ? this.renderer.pickGround(this.pointer.x, this.pointer.y)
        : null;
    const hit = ground ? pickEntity(state, ground.x, ground.z) : null;
    if (!hit || !this.pointer) {
      this.hoverTip.hide();
      return;
    }
    const hint = this.pickingStops ? de.info.pickStopsHint : de.info.hoverHint;
    this.hoverTip.show(labelOf(state, hit), hint, 'ok', this.pointer.x, this.pointer.y);
  }
}

function labelOf(state: GameState, hit: Selection): string {
  if (hit.kind !== 'vehicle') return siteLabel(state, hit.id);
  const v = state.vehicles.find((x) => x.id === hit.id);
  return v?.kind === 'truck' ? truckLabel(state, v.id) : de.info.supplier;
}
