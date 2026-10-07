import {
  BoxGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  Sprite,
  SpriteMaterial,
} from 'three';
import { zoneTypes } from '../../content/zones';
import type { GameState, Zone } from '../../sim/state/gameState';
import { cellsBeside, type Side } from '../../sim/world/access';
import { shapeCenter, shapeContains } from '../../sim/world/zoneShape';
import type { Footprint } from '../../sim/world/grid';
import { RoadNetwork } from '../../sim/world/roadNetwork';
import { siteAccess, sites } from '../../sim/world/sites';
import { labelTexture } from '../labels/labelTexture';
import { palette } from '../scene/palette';

const plane = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const gateGeometry = new BoxGeometry(1, 0.08, 1);
const gateMaterial = new MeshLambertMaterial({ color: palette.gate });
const zoneMaterials = new Map<string, MeshLambertMaterial>();

/**
 * Zonen (farbige Fläche mit Buchstabe und Tor-Markierung) und das Warnsymbol
 * „nicht angeschlossen“ über Zonen und Export-Ausfahrten ohne Straße am Tor.
 */
export class SitesView {
  readonly root = new Group();
  private lastKey = '';

  sync(state: Readonly<GameState>): void {
    const key = syncKey(state);
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.root.clear();
    for (const zone of state.zones) this.root.add(zoneMesh(zone));
    const network = new RoadNetwork(state);
    for (const site of sites(state as GameState)) {
      this.root.add(...gateMarkers(site.parts, site.gate));
      if (!siteAccess(network, site)) this.root.add(warning(shapeCenter(site.parts)));
    }
  }
}

function zoneMesh(zone: Zone): Group {
  const group = new Group();
  const color = zoneTypes[zone.kind].color;
  let material = zoneMaterials.get(zone.kind);
  if (!material) {
    material = new MeshLambertMaterial({ color });
    zoneMaterials.set(zone.kind, material);
  }
  for (const part of zone.parts) group.add(floorOf(zone, part, material));
  const center = shapeCenter(zone.parts);
  const largest = Math.max(...zone.parts.map((p) => Math.min(p.width, p.depth)));
  const label = new Sprite(
    new SpriteMaterial({ map: labelTexture(zone.kind, palette.zoneLabelBg, '#ffffff') }),
  );
  const size = Math.min(2.2, Math.max(0.8, largest * 0.6));
  label.scale.set(size, size, 1);
  label.position.set(center.x, 0.6 + size / 2, center.z);
  group.add(label);
  group.userData['zoneId'] = zone.id;
  return group;
}

/** Bodenfläche eines Teils; nach außen etwas eingerückt, zu anderen Teilen nahtlos. */
function floorOf(zone: Zone, p: Footprint, material: MeshLambertMaterial): Mesh {
  const open = (side: Side): number =>
    cellsBeside(p, side).every((c) => !shapeContains(zone.parts, c.x, c.z)) ? 0.05 : 0;
  const [n, e, s, w] = [open('N'), open('E'), open('S'), open('W')];
  const floor = new Mesh(plane, material);
  floor.scale.set(p.width - w - e, 1, p.depth - n - s);
  floor.position.set(p.x + w + (p.width - w - e) / 2, 0.015, p.z + n + (p.depth - n - s) / 2);
  floor.receiveShadow = true;
  return floor;
}

/** Schmale Balken auf der Tor-Seite, innen an der Kante (bis zu 3 Felder um die Mitte). */
function gateMarkers(parts: Footprint[], side: Side): Mesh[] {
  const horizontal = side === 'N' || side === 'S';
  return cellsBeside(parts, side)
    .slice(0, 3)
    .map((c) => {
      const mesh = new Mesh(gateGeometry, gateMaterial);
      mesh.scale.set(horizontal ? 1 : 0.3, 1, horizontal ? 0.3 : 1);
      const x = side === 'E' ? c.x - 0.15 : side === 'W' ? c.x + 1.15 : c.x + 0.5;
      const z = side === 'S' ? c.z - 0.15 : side === 'N' ? c.z + 1.15 : c.z + 0.5;
      mesh.position.set(x, 0.05, z);
      return mesh;
    });
}

function warning(at: { x: number; z: number }): Sprite {
  const sprite = new Sprite(
    new SpriteMaterial({ map: labelTexture('!', palette.warningBg, '#ffffff'), depthTest: false }),
  );
  sprite.scale.set(2.2, 2.2, 1);
  sprite.position.set(at.x, 5.5, at.z);
  sprite.renderOrder = 20;
  sprite.name = 'not-connected';
  return sprite;
}

/** Ändert sich, sobald Zonen, Tore, Straßen oder Gebäude sich ändern. */
function syncKey(state: Readonly<GameState>): string {
  const zones = state.zones.map((z) => `${z.id}:${JSON.stringify(z.parts)}:${z.gate}`);
  const buildings = state.buildings.map((b) => `${b.id}:${b.x}:${b.z}`);
  let roads = state.roads.length;
  for (const r of state.roads) roads = (Math.imul(roads, 31) + r.x * 257 + r.z + 1) | 0;
  return `${zones.join('|')}#${buildings.join('|')}#${roads}`;
}
