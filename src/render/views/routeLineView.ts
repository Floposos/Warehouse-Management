import { BoxGeometry, InstancedMesh, MeshBasicMaterial, Object3D } from 'three';
import type { Cell } from '../../sim/world/roadLine';
import { palette } from '../scene/palette';

const MAX_SEGMENTS = 512;
const HEIGHT = 0.09;

/** Fahrweg des ausgewählten LKW als blaues Band auf der Straße (Feldmitte zu Feldmitte). */
export class RouteLineView {
  readonly root: InstancedMesh;
  private readonly dummy = new Object3D();
  private key = '';

  constructor() {
    const material = new MeshBasicMaterial({
      color: palette.routeLine,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    this.root = new InstancedMesh(new BoxGeometry(1, 0.02, 0.16), material, MAX_SEGMENTS);
    this.root.frustumCulled = false;
    this.root.renderOrder = 5;
    this.root.count = 0;
  }

  /** Zeigt den Weg ab `from` (aktuelle Lage) über die restlichen Felder; null blendet aus. */
  show(from: { x: number; z: number } | null, cells: readonly Cell[]): void {
    const points = from ? [from, ...cells.map((c) => ({ x: c.x + 0.5, z: c.z + 0.5 }))] : [];
    const key = points.map((p) => `${p.x.toFixed(2)},${p.z.toFixed(2)}`).join(';');
    if (key === this.key) return;
    this.key = key;
    const count = Math.min(Math.max(0, points.length - 1), MAX_SEGMENTS);
    for (let i = 0; i < count; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (!a || !b) break;
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      this.dummy.position.set((a.x + b.x) / 2, HEIGHT, (a.z + b.z) / 2);
      this.dummy.rotation.set(0, -Math.atan2(b.z - a.z, b.x - a.x), 0);
      this.dummy.scale.set(length + 0.16, 1, 1);
      this.dummy.updateMatrix();
      this.root.setMatrixAt(i, this.dummy.matrix);
    }
    this.root.count = count;
    this.root.instanceMatrix.needsUpdate = true;
  }
}
