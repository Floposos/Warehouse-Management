import {
  Group,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  type BufferGeometry,
  type Material,
} from 'three';
import type { RoadTile } from '../../sim/state/gameState';
import { DIRS, RoadNetwork, roadShape } from '../../sim/world/roadNetwork';
import { palette } from '../scene/palette';

const asphaltGeometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
/** Halbe Mittellinie vom Feldmittelpunkt Richtung Nachbar (entlang +x, wird gedreht). */
const markGeometry = new PlaneGeometry(0.36, 0.07).rotateX(-Math.PI / 2).translate(0.25, 0, 0);
const asphaltMaterial = new MeshLambertMaterial({ color: palette.road });
const markMaterial = new MeshLambertMaterial({ color: palette.roadMarking });

/**
 * Straßen als zwei Instanz-Gruppen (Asphalt, Markierung): wenige Zeichenaufrufe,
 * auch bei tausenden Feldern. Verbindungsstücke ergeben sich aus den Nachbarn:
 * Mittellinie bei geraden Stücken, Kurven und Enden; Kreuzungen und T-Stücke bleiben frei.
 */
export class RoadsView {
  readonly root = new Group();
  private lastHash = -1;
  private asphalt: InstancedMesh | null = null;
  private marks: InstancedMesh | null = null;

  sync(roads: readonly RoadTile[]): void {
    const hash = roadsHash(roads);
    if (hash === this.lastHash) return;
    this.lastHash = hash;
    this.rebuild(roads);
  }

  private rebuild(roads: readonly RoadTile[]): void {
    this.asphalt?.dispose();
    this.marks?.dispose();
    this.root.clear();
    if (roads.length === 0) return;
    const network = new RoadNetwork({ roads: [...roads] });
    const dummy = new Object3D();
    this.asphalt = instanced(asphaltGeometry, asphaltMaterial, roads.length);
    const markTransforms: { x: number; z: number; angle: number }[] = [];
    roads.forEach((r, i) => {
      dummy.position.set(r.x + 0.5, 0.02, r.z + 0.5);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      this.asphalt?.setMatrixAt(i, dummy.matrix);
      const mask = network.connections(r.x, r.z);
      const shape = roadShape(mask);
      if (shape === 'tee' || shape === 'cross' || shape === 'single') return;
      for (const d of DIRS) {
        if (mask & d.bit) markTransforms.push({ x: r.x, z: r.z, angle: -Math.atan2(d.dz, d.dx) });
      }
    });
    this.root.add(this.asphalt);
    if (markTransforms.length > 0) {
      this.marks = instanced(markGeometry, markMaterial, markTransforms.length);
      markTransforms.forEach((m, i) => {
        dummy.position.set(m.x + 0.5, 0.03, m.z + 0.5);
        dummy.rotation.set(0, m.angle, 0);
        dummy.updateMatrix();
        this.marks?.setMatrixAt(i, dummy.matrix);
      });
      this.root.add(this.marks);
    }
  }
}

function instanced(geometry: BufferGeometry, material: Material, count: number): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.receiveShadow = true;
  return mesh;
}

/** Billige Prüfsumme über alle Felder, damit nur bei Änderungen neu aufgebaut wird. */
function roadsHash(roads: readonly RoadTile[]): number {
  let h = roads.length;
  for (const r of roads) h = (Math.imul(h, 31) + r.x * 257 + r.z + 1) | 0;
  return h;
}
