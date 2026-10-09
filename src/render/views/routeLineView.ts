import { BoxGeometry, Color, InstancedMesh, MeshBasicMaterial, Object3D } from 'three';
import type { Cell } from '../../sim/world/roadLine';

const HEIGHT = 0.09;

/** Ein Weg: Startpunkt (aktuelle Lage) und die restlichen Felder, in einer Farbe. */
export interface RouteLine {
  from: { x: number; z: number };
  cells: readonly Cell[];
  color: number;
}

/**
 * Fahrwege als farbige Bänder auf der Straße (Feldmitte zu Feldmitte), alle in einem
 * InstancedMesh. Seit T2.1 je Weg eigene Farbe (Tourfarbe, Automatik grau).
 */
export class RouteLineView {
  readonly root: InstancedMesh;
  private readonly dummy = new Object3D();
  private readonly color = new Color();
  private key = '';

  constructor(
    private readonly maxSegments: number,
    private readonly width: number,
    renderOrder: number,
  ) {
    const material = new MeshBasicMaterial({ transparent: true, opacity: 0.8, depthWrite: false });
    this.root = new InstancedMesh(new BoxGeometry(1, 0.02, width), material, maxSegments);
    this.root.frustumCulled = false;
    this.root.renderOrder = renderOrder;
    this.root.count = 0;
  }

  /** Zeigt die Wege; eine leere Liste blendet alles aus. Baut nur bei Änderungen neu. */
  show(lines: readonly RouteLine[]): void {
    const key = lines
      .map(
        (l) =>
          `${l.color}:${l.from.x.toFixed(2)},${l.from.z.toFixed(2)}:${l.cells.length}:${l.cells[0]?.x},${l.cells[0]?.z}`,
      )
      .join(';');
    if (key === this.key) return;
    this.key = key;
    let count = 0;
    for (const line of lines) {
      this.color.set(line.color);
      let a = line.from;
      for (const c of line.cells) {
        if (count >= this.maxSegments) break;
        const b = { x: c.x + 0.5, z: c.z + 0.5 };
        const length = Math.hypot(b.x - a.x, b.z - a.z);
        this.dummy.position.set((a.x + b.x) / 2, HEIGHT, (a.z + b.z) / 2);
        this.dummy.rotation.set(0, -Math.atan2(b.z - a.z, b.x - a.x), 0);
        this.dummy.scale.set(length + this.width, 1, 1);
        this.dummy.updateMatrix();
        this.root.setMatrixAt(count, this.dummy.matrix);
        this.root.setColorAt(count, this.color);
        count += 1;
        a = b;
      }
    }
    this.root.count = count;
    this.root.instanceMatrix.needsUpdate = true;
    if (this.root.instanceColor) this.root.instanceColor.needsUpdate = true;
  }
}
