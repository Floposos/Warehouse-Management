import { BoxGeometry, Color, InstancedMesh, MeshBasicMaterial, Object3D } from 'three';
import type { Footprint } from '../../sim/world/grid';
import { palette } from '../scene/palette';

/** Art der Vorschau: baubar (grün), nicht baubar (rot) oder Abriss-Markierung. */
export type GhostStyle = 'valid' | 'invalid' | 'demolish';

export interface Ghost {
  footprint: Footprint;
  height: number;
  style: GhostStyle;
}

const COLORS: Record<GhostStyle, Color> = {
  valid: new Color(palette.ghostValid),
  invalid: new Color(palette.ghostInvalid),
  demolish: new Color(palette.ghostDemolish),
};
/** Mehr Teile zeigt die Vorschau nicht (längste Straße quer über das Gelände: 255 Felder). */
const MAX_PARTS = 512;

/** Durchscheinendes „Geisterbild“: Gebäude, Straßenfelder oder Abriss-Markierung. */
export class GhostView {
  readonly root: InstancedMesh;
  private readonly dummy = new Object3D();

  constructor() {
    const material = new MeshBasicMaterial({ transparent: true, opacity: 0.45, depthWrite: false });
    this.root = new InstancedMesh(new BoxGeometry(1, 1, 1), material, MAX_PARTS);
    this.root.renderOrder = 10;
    this.root.frustumCulled = false;
    // Farben gleich anlegen: nachträglich erzeugte Instanzfarben würde das Material übersehen.
    for (let i = 0; i < MAX_PARTS; i++) this.root.setColorAt(i, COLORS.valid);
    this.root.count = 0;
  }

  show(parts: readonly Ghost[]): void {
    const count = Math.min(parts.length, MAX_PARTS);
    for (let i = 0; i < count; i++) {
      const { footprint: f, height, style } = parts[i] as Ghost;
      // Beim Abriss etwas größer, damit die Markierung das Objekt sichtbar umschließt.
      const pad = style === 'demolish' ? 0.15 : 0.02;
      this.dummy.position.set(f.x + f.width / 2, (height + pad) / 2, f.z + f.depth / 2);
      this.dummy.scale.set(f.width + pad, height + pad, f.depth + pad);
      this.dummy.updateMatrix();
      this.root.setMatrixAt(i, this.dummy.matrix);
      this.root.setColorAt(i, COLORS[style]);
    }
    this.root.count = count;
    this.root.instanceMatrix.needsUpdate = true;
    if (this.root.instanceColor) this.root.instanceColor.needsUpdate = true;
  }
}
