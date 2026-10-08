import { Group } from 'three';
import { trafficConfig } from '../../config/traffic';
import { vehicleConfig } from '../../config/vehicles';
import type { GameState } from '../../sim/state/gameState';
import { valuesOf } from '../../sim/vehicles/fleet';
import type { Vehicle } from '../../sim/vehicles/types';
import { sites } from '../../sim/world/sites';
import {
  createTruckModel,
  setTruckBroken,
  setTruckCargo,
  setTruckDot,
  setTruckJam,
} from '../models/truckModel';
import { bayPose } from './bayPose';
import { routeColorOf } from './routeColors';
import { LANE_OFFSET, PARKED_OFFSET, vehiclePose, type Pose } from './vehiclePose';

/** Fahrzeuge: ein Modell je Fahrzeug, Lage jedes Bild neu (gleitet zwischen den Schritten). */
export class VehiclesView {
  readonly root = new Group();
  private readonly models = new Map<number, Group>();

  /** Aktuelle Lage (Modellmitte auf dem Boden) eines Fahrzeugs; null = unbekannt. */
  positionOf(id: number): { x: number; z: number } | null {
    const model = this.models.get(id);
    return model ? { x: model.position.x, z: model.position.z } : null;
  }

  sync(state: Readonly<GameState>, alpha: number): void {
    const seen = new Set<number>();
    const bays = bayPoses(state);
    for (const v of state.vehicles) {
      seen.add(v.id);
      let model = this.models.get(v.id);
      if (!model) {
        model =
          v.kind === 'truck'
            ? createTruckModel('truck', v.model, v.drive === 'electric')
            : createTruckModel('supplier');
        model.userData['vehicleId'] = v.id;
        this.models.set(v.id, model);
        this.root.add(model);
      }
      const extra = isMoving(v) ? speedOf(v) * alpha : 0;
      const pose =
        bays.get(v.id) ??
        vehiclePose(v.route, v.progress, extra, v.heading, v.offRoad ? PARKED_OFFSET : LANE_OFFSET);
      if (pose) {
        model.position.set(pose.x, 0, pose.z);
        model.rotation.y = pose.angle;
      }
      setTruckCargo(model, v.cargo?.product ?? null);
      const broken = v.kind === 'truck' && v.upkeep.brokenTicks > 0;
      setTruckJam(model, v.waitTicks >= trafficConfig.jamWarnTicks || broken);
      setTruckBroken(model, broken);
      if (v.kind === 'truck') setTruckDot(model, routeColorOf(state, v));
    }
    for (const [id, model] of this.models) {
      if (seen.has(id)) continue;
      this.root.remove(model);
      this.models.delete(id);
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
