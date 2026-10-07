import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';
import type { BuildingType } from '../../content/buildings';
import { palette } from '../scene/palette';

const materials = {
  body: new MeshLambertMaterial({ color: palette.hall }),
  trim: new MeshLambertMaterial({ color: palette.hallTrim }),
  roof: new MeshLambertMaterial({ color: palette.roof }),
  door: new MeshLambertMaterial({ color: palette.door }),
};

/**
 * Low-Poly-Halle aus Grundformen. Ursprung = Mitte der Grundfläche am Boden,
 * Breite entlang x, Tiefe entlang z; füllt die Felder exakt aus.
 */
export function createHallModel(type: BuildingType): Group {
  const { width: w, depth: d, height: h } = type;
  const hall = new Group();
  const part = (
    sx: number,
    sy: number,
    sz: number,
    x: number,
    y: number,
    z: number,
    material: MeshLambertMaterial,
  ): void => {
    const mesh = new Mesh(new BoxGeometry(sx, sy, sz), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hall.add(mesh);
  };
  part(w, h, d, 0, h / 2, 0, materials.body);
  part(w, 0.3, d, 0, 0.15, 0, materials.trim);
  // Gestuftes Flachdach
  part(w, 0.25, d, 0, h + 0.125, 0, materials.roof);
  part(w * 0.9, 0.35, d * 0.5, 0, h + 0.425, 0, materials.roof);
  // Zwei Rolltore an der Südseite (+z)
  const doorW = Math.min(1.6, w / 4);
  for (const x of [-w / 4, w / 4])
    part(doorW, h * 0.6, 0.06, x, (h * 0.6) / 2, d / 2 + 0.03, materials.door);
  return hall;
}
