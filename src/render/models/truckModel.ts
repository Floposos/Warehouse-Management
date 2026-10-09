import {
  type InstancedMesh,
  BoxGeometry,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  SphereGeometry,
} from 'three';
import { products, type ProductId } from '../../content/products';
import { palette } from '../scene/palette';
import { InstancedPart, partMatrix } from '../views/instancedPart';

/** Wie das Fahrzeug aussieht (aus dem Zustand abgeleitet). */
export interface TruckLook {
  own: boolean;
  shape: 'truck' | 'van';
  electric: boolean;
  cargo: ProductId | null;
  /** Farbpunkt in der Tourfarbe (T2.1); null = keiner (Zulieferer). */
  dot: number | null;
  jam: boolean;
  broken: boolean;
}

/** Maße je Fahrzeugtyp (T2.5): Transporter kürzer mit zwei Kisten, LKW lang mit drei. */
const shapes = {
  truck: {
    body: partMatrix(0.5, 0.06, 0.32, -0.08, 0.13, 0),
    rearWheel: -0.22,
    crates: [-0.22, -0.08, 0.06],
  },
  van: { body: partMatrix(0.34, 0.06, 0.32, 0, 0.13, 0), rearWheel: -0.08, crates: [-0.08, 0.06] },
} as const;

const box = new BoxGeometry(1, 1, 1);
const white = (): MeshLambertMaterial => new MeshLambertMaterial({ color: 0xffffff });
const wheelsOf = (rear: number): Matrix4[] =>
  [rear, 0.26].flatMap((x) => [-0.15, 0.15].map((z) => partMatrix(0.1, 0.1, 0.04, x, 0.06, z)));
const wheels = { truck: wheelsOf(shapes.truck.rearWheel), van: wheelsOf(shapes.van.rearWheel) };
const crates = {
  truck: shapes.truck.crates.map((x) => partMatrix(0.12, 0.14, 0.24, x, 0.23, 0)),
  van: shapes.van.crates.map((x) => partMatrix(0.12, 0.14, 0.24, x, 0.23, 0)),
};
const smoke = [
  [0.32, 0.5, 1],
  [0.26, 0.64, 1.3],
  [0.18, 0.8, 1.6],
].map(([x, y, s]) =>
  new Matrix4().makeScale(s ?? 1, s ?? 1, s ?? 1).setPosition(x ?? 0, y ?? 0, 0),
);
const red = new MeshBasicMaterial({ color: 0xe5484d });

/**
 * Kleine Low-Poly-LKW (Zulieferer weiß, eigene orange) als Bauteile mit je einer
 * InstancedMesh (T2.9): wenige Zeichenaufrufe auch bei 300 Fahrzeugen. Fährt entlang +x,
 * Ursprung = Mitte am Boden. Kisten in Produktfarbe, Elektro mit grünem Dachstreifen,
 * Tourfarbe als Punkt, rotes Ausrufezeichen bei Stau oder Panne, Rauch bei Panne.
 */
export class TruckParts {
  private readonly cab = new InstancedPart(
    box,
    white(),
    partMatrix(0.22, 0.28, 0.3, 0.26, 0.24, 0),
    true,
  );
  private readonly body = new InstancedPart(
    box,
    new MeshLambertMaterial({ color: palette.truckBody }),
    shapes.truck.body,
    true,
  );
  private readonly wheel = new InstancedPart(
    box,
    new MeshLambertMaterial({ color: palette.wheel }),
    wheels.truck[0] ?? new Matrix4(),
    false,
  );
  private readonly stripe = new InstancedPart(
    box,
    new MeshLambertMaterial({ color: palette.electricMark }),
    partMatrix(0.18, 0.02, 0.3, 0.26, 0.39, 0),
    false,
  );
  private readonly crate = new InstancedPart(box, white(), new Matrix4(), true);
  private readonly dot = new InstancedPart(
    new SphereGeometry(0.09, 10, 6),
    new MeshBasicMaterial({ color: 0xffffff }),
    new Matrix4().setPosition(0.26, 0.48, 0),
    false,
  );
  private readonly jamBar = new InstancedPart(
    box,
    red,
    partMatrix(0.08, 0.3, 0.08, 0, 0.95, 0),
    false,
  );
  private readonly jamDot = new InstancedPart(
    box,
    red,
    partMatrix(0.08, 0.09, 0.08, 0, 0.72, 0),
    false,
  );
  private readonly puff = new InstancedPart(
    new SphereGeometry(0.1, 8, 6),
    new MeshLambertMaterial({ color: palette.breakdownSmoke }),
    new Matrix4(),
    false,
  );
  private readonly parts = [
    this.cab,
    this.body,
    this.wheel,
    this.stripe,
    this.crate,
    this.dot,
    this.jamBar,
    this.jamDot,
    this.puff,
  ];

  get meshes(): readonly InstancedMesh[] {
    return this.parts.map((p) => p.mesh);
  }

  begin(): void {
    for (const p of this.parts) p.begin();
  }

  /** Ein Fahrzeug an der Lage `base` (Position, Drehung, Maßstab). */
  add(base: Matrix4, look: TruckLook): void {
    this.cab.add(base, look.own ? palette.ownCab : palette.supplierCab);
    this.body.add(base, undefined, shapes[look.shape].body);
    for (const w of wheels[look.shape]) this.wheel.add(base, undefined, w);
    if (look.electric) this.stripe.add(base);
    if (look.cargo) {
      const color = products[look.cargo].color;
      for (const c of crates[look.shape]) this.crate.add(base, color, c);
    }
    if (look.dot !== null) this.dot.add(base, look.dot);
    if (look.jam || look.broken) {
      this.jamBar.add(base);
      this.jamDot.add(base);
    }
    if (look.broken) for (const m of smoke) this.puff.add(base, undefined, m);
  }

  end(): void {
    for (const p of this.parts) p.end();
  }
}
