import { Group } from 'three';
import { buildingTypes } from '../../content/buildings';
import type { Building } from '../../sim/state/gameState';
import { createHallModel } from '../models/hallModel';

/**
 * Spiegelt `state.buildings` in der Szene. In M0 ändern sich Gebäude nur beim Laden,
 * daher genügt ein Neuaufbau bei `sync`. Ab M1 mit Instancing je Typ.
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
      const model = createHallModel(type);
      model.position.set(building.x + type.width / 2, 0, building.z + type.depth / 2);
      model.userData['buildingId'] = building.id;
      this.root.add(model);
    }
  }
}
