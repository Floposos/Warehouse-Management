import { Group } from 'three';
import { vehicleConfig } from '../../config/vehicles';
import type { Vehicle } from '../../sim/vehicles/types';
import { createTruckModel, setTruckCargo } from '../models/truckModel';
import { vehiclePose } from './vehiclePose';

/** Fahrzeuge: ein Modell je Fahrzeug, Lage jedes Bild neu (gleitet zwischen den Schritten). */
export class VehiclesView {
  readonly root = new Group();
  private readonly models = new Map<number, Group>();

  sync(vehicles: readonly Vehicle[], alpha: number): void {
    const seen = new Set<number>();
    for (const v of vehicles) {
      seen.add(v.id);
      let model = this.models.get(v.id);
      if (!model) {
        model = createTruckModel(v.kind);
        model.userData['vehicleId'] = v.id;
        this.models.set(v.id, model);
        this.root.add(model);
      }
      const pose = vehiclePose(v.route, v.progress, isMoving(v) ? speedOf(v) * alpha : 0);
      if (pose) {
        model.position.set(pose.x, 0, pose.z);
        model.rotation.y = pose.angle;
      }
      setTruckCargo(model, v.cargo?.product ?? null);
    }
    for (const [id, model] of this.models) {
      if (seen.has(id)) continue;
      this.root.remove(model);
      this.models.delete(id);
    }
  }
}

function isMoving(v: Vehicle): boolean {
  return v.kind === 'supplier'
    ? v.phase === 'toSite' || v.phase === 'toExit'
    : v.phase === 'toPickup' || v.phase === 'toDropoff';
}

function speedOf(v: Vehicle): number {
  return v.kind === 'supplier' ? vehicleConfig.supplierSpeed : vehicleConfig.truckSpeed;
}
