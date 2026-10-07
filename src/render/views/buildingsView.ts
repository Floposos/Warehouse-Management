import { Group } from 'three';
import { buildingTypes } from '../../content/buildings';
import type { Building } from '../../sim/state/gameState';
import { createExportExitModel } from '../models/exportExitModel';
import { createHallModel } from '../models/hallModel';

/**
 * Spiegelt `state.buildings` in der Szene. Gebäude ändern sich selten (Bauen, Abriss, Laden),
 * daher genügt ein Neuaufbau bei Änderung.
 */
export class BuildingsView {
  readonly root = new Group();
  private lastKey = '';

  sync(buildings: readonly Building[]): void {
    const key = buildings.map((b) => `${b.id}:${b.type}:${b.x}:${b.z}`).join('|');
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.root.clear();
    for (const building of buildings) {
      const type = buildingTypes[building.type];
      const model =
        building.type === 'exportExit' ? createExportExitModel(type) : createHallModel(type);
      model.position.set(building.x + type.width / 2, 0, building.z + type.depth / 2);
      model.userData['buildingId'] = building.id;
      this.root.add(model);
    }
  }
}
