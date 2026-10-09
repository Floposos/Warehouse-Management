import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
} from 'three';
import { entranceConfig as ec } from '../../config/entrance';
import { worldConfig } from '../../config/world';
import { trafficFactorPercent } from '../../sim/traffic/entrance';
import { palette } from '../scene/palette';

/** Bundesstraße am Ende der Eingangsstraße (zwei Spuren, Nord–Süd), außerhalb des Geländes. */
const ROAD_X = -worldConfig.entranceRoadLength - 1;
const LENGTH = worldConfig.campusDepth + 80;
const START_Z = -40;
/** Felder je Simulationsschritt. */
const SPEED = 0.35;
const MAX_CARS = ec.externalCarsRush;
const GOLDEN = 0.6180339887;

/** Anzahl sichtbarer Autos je Richtung zur Tageszeit (mehr in der Rushhour). */
export function externalCarCount(tick: number): number {
  const share = (trafficFactorPercent(tick) - 100) / (ec.rushFactorPercent - 100);
  return Math.round(ec.externalCars + (ec.externalCarsRush - ec.externalCars) * share);
}

/** Lage eines Autos entlang der Straße (Feld), rein aus der Zeit berechnet: deterministisch. */
export function externalCarZ(index: number, lane: 0 | 1, time: number): number {
  const offset = ((index * GOLDEN + lane * 0.5) % 1) * LENGTH;
  const along = (offset + time * SPEED) % LENGTH;
  return lane === 0 ? START_Z + along : START_Z + LENGTH - along;
}

/**
 * Externer Verkehr (T2.7, nur Darstellung): Autos auf der Bundesstraße, in der Rushhour
 * dichter. Beeinflusst die Simulation nicht; die Wartezeit an der Einfahrt rechnet
 * `sim/traffic/entrance.ts`.
 */
export class ExternalTrafficView {
  readonly root = new Group();
  private readonly cars: InstancedMesh;
  private readonly matrix = new Matrix4();

  constructor() {
    const road = new Mesh(
      new PlaneGeometry(2, LENGTH),
      new MeshLambertMaterial({ color: palette.road }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(ROAD_X, 0.02, START_Z + LENGTH / 2);
    road.receiveShadow = true;
    const line = new Mesh(
      new PlaneGeometry(0.06, LENGTH),
      new MeshLambertMaterial({ color: palette.roadMarking }),
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(ROAD_X, 0.03, START_Z + LENGTH / 2);
    this.cars = new InstancedMesh(
      new BoxGeometry(0.45, 0.32, 0.8),
      new MeshLambertMaterial(),
      2 * MAX_CARS,
    );
    this.cars.castShadow = true;
    const color = new Color();
    for (let i = 0; i < 2 * MAX_CARS; i++) {
      color.setHex(palette.externalCars[i % palette.externalCars.length] ?? 0xffffff);
      this.cars.setColorAt(i, color);
    }
    this.cars.count = 0;
    this.root.add(road, line, this.cars);
  }

  /** `tick` + `alpha` = Zeit in Schritten (gleitet zwischen den Schritten). */
  sync(tick: number, alpha: number): void {
    const n = externalCarCount(tick);
    const time = tick + alpha;
    let k = 0;
    for (const lane of [0, 1] as const) {
      const x = ROAD_X + (lane === 0 ? 0.5 : -0.5);
      for (let i = 0; i < n; i++) {
        this.matrix.makeTranslation(x, 0.22, externalCarZ(i, lane, time));
        this.cars.setMatrixAt(k++, this.matrix);
      }
    }
    this.cars.count = k;
    this.cars.instanceMatrix.needsUpdate = true;
  }
}
