import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  Sprite,
  SpriteMaterial,
} from 'three';
import { zoneConfig } from '../../config/zones';
import { products } from '../../content/products';
import { zoneTypes } from '../../content/zones';
import { zoneStatus } from '../../sim/production/production';
import type { Zone } from '../../sim/state/gameState';
import { labelTexture } from '../labels/labelTexture';
import { palette } from '../scene/palette';

/** Einheiten je Kiste: so passen bei voller Zone je Ware eine Kiste pro Feld hin. */
const UNITS_PER_CRATE = zoneConfig.capacityPerField;
/** Kistenplätze je Feld (2 × 2). */
const SLOTS = [
  [0.27, 0.27],
  [0.73, 0.27],
  [0.27, 0.73],
  [0.73, 0.73],
] as const;
const MAX_CRATES = 4096;

/**
 * Warenbestand als farbige Kisten in den Zonen (Entscheidung 07.10.2026: Kisten plus
 * Bestandssymbole) und Schild „voll“, wenn eine Zone nichts mehr aufnehmen bzw. erzeugen kann.
 */
export class StockView {
  readonly root = new Group();
  private readonly crates: InstancedMesh;
  private readonly badges = new Group();
  private readonly dummy = new Object3D();
  private readonly color = new Color();
  private lastKey = '';

  constructor() {
    const material = new MeshLambertMaterial({ color: 0xffffff });
    this.crates = new InstancedMesh(new BoxGeometry(0.34, 0.3, 0.34), material, MAX_CRATES);
    this.crates.castShadow = true;
    for (let i = 0; i < MAX_CRATES; i++) this.crates.setColorAt(i, this.color.set(0xffffff));
    this.crates.count = 0;
    this.crates.frustumCulled = false;
    this.root.add(this.crates, this.badges);
  }

  sync(zones: readonly Zone[]): void {
    const key = zones.map((z) => `${z.id}:${z.x}:${z.z}:${JSON.stringify(z.stock)}`).join('|');
    if (key === this.lastKey) return;
    this.lastKey = key;
    let n = 0;
    this.badges.clear();
    for (const zone of zones) {
      n = this.placeCrates(zone, n);
      if (zoneStatus(zone) === 'full') this.badges.add(fullBadge(zone));
    }
    this.crates.count = n;
    this.crates.instanceMatrix.needsUpdate = true;
    if (this.crates.instanceColor) this.crates.instanceColor.needsUpdate = true;
  }

  private placeCrates(zone: Zone, start: number): number {
    let n = start;
    let slot = 0;
    const slotsTotal = zone.width * zone.depth * SLOTS.length;
    for (const product of zoneTypes[zone.kind].stores) {
      const count = Math.ceil((zone.stock[product] ?? 0) / UNITS_PER_CRATE);
      for (let i = 0; i < count && slot < slotsTotal && n < MAX_CRATES; i++, slot++, n++) {
        const cell = Math.floor(slot / SLOTS.length);
        const [ox, oz] = SLOTS[slot % SLOTS.length] ?? [0.5, 0.5];
        const x = zone.x + (cell % zone.width) + ox;
        const z = zone.z + Math.floor(cell / zone.width) + oz;
        this.dummy.position.set(x, 0.17, z);
        this.dummy.updateMatrix();
        this.crates.setMatrixAt(n, this.dummy.matrix);
        this.crates.setColorAt(n, this.color.set(products[product].color));
      }
    }
    return n;
  }
}

function fullBadge(zone: Zone): Sprite {
  const sprite = new Sprite(
    new SpriteMaterial({ map: labelTexture('voll', palette.fullBg, '#ffffff') }),
  );
  sprite.scale.set(1.6, 1.6, 1);
  sprite.position.set(zone.x + zone.width / 2 + 1.2, 3, zone.z + zone.depth / 2);
  sprite.name = 'zone-full';
  return sprite;
}
