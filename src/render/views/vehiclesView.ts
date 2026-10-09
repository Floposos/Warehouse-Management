import { Group, Matrix4, Quaternion, Vector3 } from 'three';
import { trafficConfig } from '../../config/traffic';
import { vehicleConfig } from '../../config/vehicles';
import type { GameState } from '../../sim/state/gameState';
import { valuesOf } from '../../sim/vehicles/fleet';
import type { Vehicle } from '../../sim/vehicles/types';
import { sites } from '../../sim/world/sites';
import { TruckParts } from '../models/truckModel';
import { bayPose } from './bayPose';
import { routeColorOf } from './routeColors';
import { LANE_OFFSET, PARKED_OFFSET, vehiclePose, type Pose } from './vehiclePose';

/** Gut sichtbar aus der Vogelperspektive, passt aber noch auf eine Fahrspur. */
const MODEL_SCALE = 1.45;
const UP = new Vector3(0, 1, 0);

/**
 * Fahrzeuge (seit T2.9 instanziert): Lage jedes Bild neu (gleitet zwischen den Schritten),
 * alle Fahrzeuge zusammen in wenigen Zeichenaufrufen.
 */
export class VehiclesView {
  readonly root = new Group();
  private readonly parts = new TruckParts();
  private readonly positions = new Map<number, { x: number; z: number }>();
  private readonly base = new Matrix4();
  private readonly position = new Vector3();
  private readonly rotation = new Quaternion();
  private readonly scale = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
  private attached: readonly unknown[] = [];

  /** Aktuelle Lage (Modellmitte auf dem Boden) eines Fahrzeugs; null = unbekannt. */
  positionOf(id: number): { x: number; z: number } | null {
    return this.positions.get(id) ?? null;
  }

  sync(state: Readonly<GameState>, alpha: number): void {
    const bays = bayPoses(state);
    this.positions.clear();
    this.parts.begin();
    for (const v of state.vehicles) {
      const extra = isMoving(v) ? speedOf(v) * alpha : 0;
      const pose =
        bays.get(v.id) ??
        vehiclePose(v.route, v.progress, extra, v.heading, v.offRoad ? PARKED_OFFSET : LANE_OFFSET);
      if (!pose) continue;
      this.positions.set(v.id, { x: pose.x, z: pose.z });
      this.position.set(pose.x, 0, pose.z);
      this.rotation.setFromAxisAngle(UP, pose.angle);
      this.base.compose(this.position, this.rotation, this.scale);
      const own = v.kind === 'truck';
      this.parts.add(this.base, {
        own,
        shape: own ? v.model : 'truck',
        electric: own && v.drive === 'electric',
        cargo: v.cargo?.product ?? null,
        dot: own ? routeColorOf(state, v) : null,
        jam: v.waitTicks >= trafficConfig.jamWarnTicks,
        broken: own && v.upkeep.brokenTicks > 0,
      });
    }
    this.parts.end();
    // Wächst ein Bauteil, ersetzt es seine InstancedMesh: Szene nachziehen.
    const meshes = this.parts.meshes;
    if (meshes.some((m, i) => m !== this.attached[i])) {
      this.root.clear();
      this.root.add(...meshes);
      this.attached = meshes;
    }
  }
}

/** Fahrzeuge auf Stellplätzen: nebeneinander hinter dem Tor ihres Orts (T2.3). */
function bayPoses(state: Readonly<GameState>): Map<number, Pose> {
  const result = new Map<number, Pose>();
  const inBay = state.vehicles.filter((v) => v.bayAt !== null && v.route[0]);
  if (inBay.length === 0) return result;
  const gates = new Map(sites(state as GameState).map((s) => [s.id, s.gate]));
  for (const v of inBay) {
    const gate = gates.get(v.bayAt ?? -1);
    const access = v.route[0];
    if (!gate || !access) continue;
    const same = inBay.filter((o) => o.bayAt === v.bayAt);
    result.set(v.id, bayPose(access, gate, same.indexOf(v), same.length));
  }
  return result;
}

function isMoving(v: Vehicle): boolean {
  if (v.offRoad || v.waitTicks > 0) return false;
  if (v.kind === 'supplier') return v.phase === 'toSite' || v.phase === 'toExit';
  if (v.upkeep.brokenTicks > 0) return false;
  return v.phase === 'toPickup' || v.phase === 'toDropoff' || v.phase === 'toWorkshop';
}

function speedOf(v: Vehicle): number {
  return v.kind === 'supplier' ? vehicleConfig.supplierSpeed : valuesOf(v).speed;
}
