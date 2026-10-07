import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
} from 'three';
import { worldConfig } from '../../config/world';
import { palette } from './palette';

/** Lage der angedeuteten Eingangsstraße: Westrand, Feldreihe z = 61. */
export const ENTRANCE_ROAD_Z = 61;
const MAJOR_EVERY = 8;

/** Gelände: Umland, Campus-Fläche mit Raster, Rand und angedeutete Eingangsstraße. */
export function createTerrain(): Group {
  const { campusWidth: w, campusDepth: d } = worldConfig;
  const group = new Group();
  group.name = 'terrain';

  const outside = new Mesh(
    new PlaneGeometry(w * 16, d * 16),
    new MeshLambertMaterial({ color: palette.outside }),
  );
  outside.rotation.x = -Math.PI / 2;
  outside.position.set(w / 2, -0.02, d / 2);
  outside.receiveShadow = true;

  const campus = new Mesh(
    new PlaneGeometry(w, d),
    new MeshLambertMaterial({ color: palette.ground }),
  );
  campus.rotation.x = -Math.PI / 2;
  campus.position.set(w / 2, 0, d / 2);
  campus.receiveShadow = true;

  group.add(outside, campus, ...createGrid(w, d), createBorder(w, d), createEntranceRoad());
  return group;
}

function createGrid(w: number, d: number): LineSegments[] {
  const minor: number[] = [];
  const major: number[] = [];
  for (let x = 1; x < w; x++) (x % MAJOR_EVERY === 0 ? major : minor).push(x, 0.01, 0, x, 0.01, d);
  for (let z = 1; z < d; z++) (z % MAJOR_EVERY === 0 ? major : minor).push(0, 0.01, z, w, 0.01, z);
  return [lines(minor, palette.gridMinor), lines(major, palette.gridMajor)];
}

function lines(points: number[], color: number): LineSegments {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  return new LineSegments(geometry, new LineBasicMaterial({ color }));
}

/** Niedriger heller Rand rund um das Gelände, mit Lücke für die Eingangsstraße. */
function createBorder(w: number, d: number): Group {
  const border = new Group();
  const material = new MeshLambertMaterial({ color: palette.border });
  const t = 0.3;
  const h = 0.25;
  const add = (sx: number, sz: number, x: number, z: number): void => {
    const piece = new Mesh(new BoxGeometry(sx, h, sz), material);
    piece.position.set(x, h / 2, z);
    piece.castShadow = true;
    border.add(piece);
  };
  add(w + 2 * t, t, w / 2, -t / 2);
  add(w + 2 * t, t, w / 2, d + t / 2);
  add(t, d, w + t / 2, d / 2);
  // Westseite mit Lücke an der Eingangsstraße
  add(t, ENTRANCE_ROAD_Z, -t / 2, ENTRANCE_ROAD_Z / 2);
  const rest = d - ENTRANCE_ROAD_Z - 1;
  add(t, rest, -t / 2, ENTRANCE_ROAD_Z + 1 + rest / 2);
  return border;
}

/** Straße von außerhalb bis an den Campusrand (1 Feld breit), mit Mittellinie. */
function createEntranceRoad(): Group {
  const length = worldConfig.entranceRoadLength;
  const road = new Group();
  road.name = 'entrance-road';
  const asphalt = new Mesh(
    new PlaneGeometry(length, 1),
    new MeshLambertMaterial({ color: palette.road }),
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.set(-length / 2, 0.02, ENTRANCE_ROAD_Z + 0.5);
  asphalt.receiveShadow = true;
  road.add(asphalt);
  const dash = new MeshLambertMaterial({ color: palette.roadMarking });
  for (let x = -length + 0.5; x < 0; x += 2) {
    const mark = new Mesh(new PlaneGeometry(0.8, 0.06), dash);
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(x + 0.4, 0.03, ENTRANCE_ROAD_Z + 0.5);
    road.add(mark);
  }
  return road;
}
