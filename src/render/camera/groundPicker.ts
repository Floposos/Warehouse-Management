import { Plane, Raycaster, Vector2, Vector3, type Camera } from 'three';

const GROUND = new Plane(new Vector3(0, 1, 0), 0);

/** Rechnet eine Bildschirmposition in einen Punkt auf dem Boden (y = 0) um. */
export class GroundPicker {
  private readonly raycaster = new Raycaster();
  private readonly ndc = new Vector2();
  private readonly hit = new Vector3();

  constructor(
    private readonly camera: Camera,
    private readonly canvas: HTMLCanvasElement,
  ) {}

  pick(clientX: number, clientY: number): { x: number; z: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    this.ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const point = this.raycaster.ray.intersectPlane(GROUND, this.hit);
    return point ? { x: point.x, z: point.z } : null;
  }
}
