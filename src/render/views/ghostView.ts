import {
  BoxGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
} from 'three';
import type { Footprint } from '../../sim/world/grid';
import { palette } from '../scene/palette';

/** Art der Vorschau: baubar (grün), nicht baubar (rot) oder Abriss-Markierung. */
export type GhostStyle = 'valid' | 'invalid' | 'demolish';

export interface Ghost {
  footprint: Footprint;
  height: number;
  style: GhostStyle;
}

const COLORS: Record<GhostStyle, number> = {
  valid: palette.ghostValid,
  invalid: palette.ghostInvalid,
  demolish: palette.ghostDemolish,
};

/** Durchscheinendes „Geisterbild“ eines Gebäudes bzw. Markierung beim Abriss. */
export class GhostView {
  readonly root = new Group();
  private readonly fill = new MeshBasicMaterial({
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  private readonly line = new LineBasicMaterial();
  private readonly box: Mesh;
  private readonly edges: LineSegments;

  constructor() {
    const geometry = new BoxGeometry(1, 1, 1);
    this.box = new Mesh(geometry, this.fill);
    this.edges = new LineSegments(new EdgesGeometry(geometry), this.line);
    this.box.renderOrder = 10;
    this.root.add(this.box, this.edges);
    this.root.visible = false;
  }

  show(ghost: Ghost | null): void {
    if (!ghost) {
      this.root.visible = false;
      return;
    }
    const { footprint: f, height, style } = ghost;
    // Leicht größer als das Gebäude, damit die Markierung beim Abriss sichtbar umschließt.
    const pad = style === 'demolish' ? 0.15 : 0.02;
    this.root.position.set(f.x + f.width / 2, (height + pad) / 2, f.z + f.depth / 2);
    this.root.scale.set(f.width + pad, height + pad, f.depth + pad);
    this.fill.color.setHex(COLORS[style]);
    this.line.color.setHex(COLORS[style]);
    this.root.visible = true;
  }
}
