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
import type { Side } from '../../sim/world/access';
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
      this.root.add(gateMarker(site.footprint, site.gate));
      if (!siteAccess(network, site)) this.root.add(warning(site.footprint));
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
  const floor = new Mesh(plane, material);
  floor.scale.set(zone.width - 0.1, 1, zone.depth - 0.1);
  floor.position.set(zone.x + zone.width / 2, 0.015, zone.z + zone.depth / 2);
  floor.receiveShadow = true;
  const label = new Sprite(
    new SpriteMaterial({ map: labelTexture(zone.kind, palette.zoneLabelBg, '#ffffff') }),
  );
  const size = Math.min(2.2, Math.max(0.8, Math.min(zone.width, zone.depth) * 0.6));
  label.scale.set(size, size, 1);
  label.position.set(zone.x + zone.width / 2, 0.6 + size / 2, zone.z + zone.depth / 2);
  group.add(floor, label);
  group.userData['zoneId'] = zone.id;
  return group;
}

/** Schmaler Balken auf der Tor-Seite, innen an der Kante. */
function gateMarker(f: Footprint, side: Side): Mesh {
  const mesh = new Mesh(gateGeometry, gateMaterial);
  const horizontal = side === 'N' || side === 'S';
  const length = Math.min(3, horizontal ? f.width : f.depth);
  mesh.scale.set(horizontal ? length : 0.3, 1, horizontal ? 0.3 : length);
  const cx = f.x + f.width / 2;
  const cz = f.z + f.depth / 2;
  const x = side === 'E' ? f.x + f.width - 0.15 : side === 'W' ? f.x + 0.15 : cx;
  const z = side === 'S' ? f.z + f.depth - 0.15 : side === 'N' ? f.z + 0.15 : cz;
  mesh.position.set(x, 0.05, z);
  return mesh;
}

function warning(f: Footprint): Sprite {
  const sprite = new Sprite(
    new SpriteMaterial({ map: labelTexture('!', palette.warningBg, '#ffffff'), depthTest: false }),
  );
  sprite.scale.set(2.2, 2.2, 1);
  sprite.position.set(f.x + f.width / 2, 5.5, f.z + f.depth / 2);
  sprite.renderOrder = 20;
  sprite.name = 'not-connected';
  return sprite;
}

/** Ändert sich, sobald Zonen, Tore, Straßen oder Gebäude sich ändern. */
function syncKey(state: Readonly<GameState>): string {
  const zones = state.zones.map((z) => `${z.id}:${z.x}:${z.z}:${z.width}:${z.depth}:${z.gate}`);
  const buildings = state.buildings.map((b) => `${b.id}:${b.x}:${b.z}`);
  let roads = state.roads.length;
  for (const r of state.roads) roads = (Math.imul(roads, 31) + r.x * 257 + r.z + 1) | 0;
  return `${zones.join('|')}#${buildings.join('|')}#${roads}`;
}
