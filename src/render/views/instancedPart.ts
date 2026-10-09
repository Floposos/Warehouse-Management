import {
  type BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  type Material,
  Matrix4,
} from 'three';

const tmp = new Matrix4();
const tint = new Color();

/**
 * Ein Bauteil vieler Fahrzeuge als eine InstancedMesh (T2.9): ein Zeichenaufruf für alle.
 * Je Bild `begin`, dann `add` je Vorkommen, dann `end`. Wächst bei Bedarf (verdoppelt).
 */
export class InstancedPart {
  mesh: InstancedMesh;
  private count = 0;

  constructor(
    private readonly geometry: BufferGeometry,
    private readonly material: Material,
    private readonly local: Matrix4,
    private readonly shadow: boolean,
    capacity = 64,
  ) {
    this.mesh = this.create(capacity);
  }

  private create(capacity: number): InstancedMesh {
    const mesh = new InstancedMesh(this.geometry, this.material, capacity);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.castShadow = this.shadow;
    mesh.count = 0;
    mesh.frustumCulled = false;
    return mesh;
  }

  begin(): void {
    this.count = 0;
  }

  /** Vorkommen an der Fahrzeuglage `base`, optional mit Farbe und eigener Teil-Lage. */
  add(base: Matrix4, color?: number, local: Matrix4 = this.local): void {
    if (this.count >= this.mesh.instanceMatrix.count) this.grow();
    tmp.multiplyMatrices(base, local);
    this.mesh.setMatrixAt(this.count, tmp);
    if (color !== undefined) this.mesh.setColorAt(this.count, tint.setHex(color));
    this.count += 1;
  }

  end(): void {
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  private grow(): void {
    const old = this.mesh;
    const next = this.create(old.instanceMatrix.count * 2);
    for (let i = 0; i < old.instanceMatrix.count; i++) {
      old.getMatrixAt(i, tmp);
      next.setMatrixAt(i, tmp);
      if (old.instanceColor) {
        old.getColorAt(i, tint);
        next.setColorAt(i, tint);
      }
    }
    old.parent?.remove(old);
    old.dispose();
    this.mesh = next;
  }
}

/** Lage eines Bauteils im Fahrzeug: Mitte (x, y, z) und Größe (sx, sy, sz). */
export function partMatrix(
  sx: number,
  sy: number,
  sz: number,
  x: number,
  y: number,
  z: number,
): Matrix4 {
  return new Matrix4().makeScale(sx, sy, sz).setPosition(x, y, z);
}
