import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  SphereGeometry,
} from 'three';
import { products, type ProductId } from '../../content/products';
import { palette } from '../scene/palette';

const geometry = new BoxGeometry(1, 1, 1);
const materials = {
  supplierCab: new MeshLambertMaterial({ color: palette.supplierCab }),
  ownCab: new MeshLambertMaterial({ color: palette.ownCab }),
  body: new MeshLambertMaterial({ color: palette.truckBody }),
  wheel: new MeshLambertMaterial({ color: palette.wheel }),
};
const crateMaterials = new Map<ProductId, MeshLambertMaterial>();
const dotGeometry = new SphereGeometry(0.09, 10, 6);
const dotMaterials = new Map<number, MeshBasicMaterial>();

function crateMaterial(product: ProductId): MeshLambertMaterial {
  let m = crateMaterials.get(product);
  if (!m) {
    m = new MeshLambertMaterial({ color: products[product].color });
    crateMaterials.set(product, m);
  }
  return m;
}

/**
 * Kleiner Low-Poly-LKW (Zulieferer weiß, eigene LKW orange), fährt entlang +x. Ursprung = Mitte am Boden.
 * Die Ladefläche (Kind „cargo“) zeigt Kisten in Produktfarbe.
 */
export function createTruckModel(kind: 'supplier' | 'truck'): Group {
  const truck = new Group();
  const box = (
    sx: number,
    sy: number,
    sz: number,
    x: number,
    y: number,
    z: number,
    m: MeshLambertMaterial,
  ): Mesh => {
    const mesh = new Mesh(geometry, m);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    truck.add(mesh);
    return mesh;
  };
  box(0.22, 0.28, 0.3, 0.26, 0.24, 0, kind === 'truck' ? materials.ownCab : materials.supplierCab);
  box(0.5, 0.06, 0.32, -0.08, 0.13, 0, materials.body);
  for (const x of [-0.22, 0.26])
    for (const z of [-0.15, 0.15]) box(0.1, 0.1, 0.04, x, 0.06, z, materials.wheel);
  const cargo = new Group();
  cargo.name = 'cargo';
  truck.add(cargo);
  // Gut sichtbar aus der Vogelperspektive, passt aber noch auf eine Fahrspur.
  truck.scale.setScalar(1.45);
  return truck;
}

/** Zeigt die Ladung als bis zu drei Kisten auf der Ladefläche (leer = keine). */
export function setTruckCargo(truck: Group, product: ProductId | null): void {
  const cargo = truck.getObjectByName('cargo');
  if (!cargo || cargo.userData['product'] === product) return;
  cargo.userData['product'] = product;
  cargo.clear();
  if (!product) return;
  for (const x of [-0.22, -0.08, 0.06]) {
    const crate = new Mesh(geometry, crateMaterial(product));
    crate.scale.set(0.12, 0.14, 0.24);
    crate.position.set(x, 0.23, 0);
    crate.castShadow = true;
    cargo.add(crate);
  }
}

/** Farbpunkt über dem Führerhaus in der Tourfarbe (T2.1). */
export function setTruckDot(truck: Group, color: number): void {
  let dot = truck.getObjectByName('dot') as Mesh | undefined;
  if (dot?.userData['color'] === color) return;
  if (!dot) {
    dot = new Mesh(dotGeometry);
    dot.name = 'dot';
    dot.position.set(0.26, 0.48, 0);
    truck.add(dot);
  }
  let material = dotMaterials.get(color);
  if (!material) {
    material = new MeshBasicMaterial({ color });
    dotMaterials.set(color, material);
  }
  dot.material = material;
  dot.userData['color'] = color;
}

const jamGeometry = new BoxGeometry(0.08, 0.3, 0.08);
const jamMaterial = new MeshBasicMaterial({ color: 0xe5484d });

/** Rotes Ausrufezeichen über dem Fahrzeug, wenn es im Stau steht (T2.4). */
export function setTruckJam(truck: Group, jammed: boolean): void {
  let mark = truck.getObjectByName('jam');
  if (!mark && !jammed) return;
  if (!mark) {
    mark = new Group();
    mark.name = 'jam';
    const bar = new Mesh(jamGeometry, jamMaterial);
    bar.position.y = 0.95;
    const dot = new Mesh(jamGeometry, jamMaterial);
    dot.scale.y = 0.3;
    dot.position.y = 0.72;
    mark.add(bar, dot);
    truck.add(mark);
  }
  mark.visible = jammed;
}
