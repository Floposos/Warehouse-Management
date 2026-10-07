/** Gebäudetypen. In M0 gibt es nur die Test-Halle; M1 ergänzt Zonen und Lieferorte. */
export interface BuildingType {
  id: string;
  /** Anzeigename-Schlüssel in ui/texts/de.ts */
  name: string;
  /** Grundfläche in Feldern (x = Breite, z = Tiefe). */
  width: number;
  depth: number;
  /** Höhe in Feldbreiten (nur Darstellung). */
  height: number;
}

export const buildingTypes = {
  testHall: { id: 'testHall', name: 'testHall', width: 8, depth: 6, height: 2.5 },
} as const satisfies Record<string, BuildingType>;

export type BuildingTypeId = keyof typeof buildingTypes;
