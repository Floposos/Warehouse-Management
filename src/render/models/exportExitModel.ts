import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';
import type { BuildingType } from '../../content/buildings';
import { palette } from '../scene/palette';

const materials = {
  base: new MeshLambertMaterial({ color: palette.exportBase }),
  frame: new MeshLambertMaterial({ color: palette.exportFrame }),
  stripe: new MeshLambertMaterial({ color: palette.exportStripe }),
};

/** Export-Ausfahrt: Plattform mit Torbogen und Schranken-Streifen. Ursprung = Mitte am Boden. */
export function createExportExitModel(type: BuildingType): Group {
  const { width: w, depth: d, height: h } = type;
  const group = new Group();
  const part = (
    sx: number,
    sy: number,
    sz: number,
    x: number,
    y: number,
    z: number,
    m: MeshLambertMaterial,
  ): void => {
    const mesh = new Mesh(new BoxGeometry(sx, sy, sz), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  part(w, 0.12, d, 0, 0.06, 0, materials.base);
  for (const sx of [-1, 1]) part(0.3, h, 0.3, (sx * (w - 0.4)) / 2, h / 2, 0, materials.frame);
  part(w, 0.3, 0.4, 0, h, 0, materials.frame);
  part(w * 0.8, 0.12, 0.12, 0, h * 0.45, 0, materials.stripe);
  return group;
}
