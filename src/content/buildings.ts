/** Gebäudetypen mit fester Grundfläche. Lieferorte sind Zonen (content/zones.ts). */
export interface BuildingType {
  id: string;
  /** Anzeigename-Schlüssel in ui/texts/de.ts */
  name: string;
  /** Grundfläche in Feldern (x = Breite, z = Tiefe). */
  width: number;
  depth: number;
  /** Höhe in Feldbreiten (nur Darstellung). */
  height: number;
  /** Muss am Geländerand stehen (z. B. Export-Ausfahrt). */
  atEdge?: boolean;
  /** Braucht eine Zufahrt von der Straße (sonst Warnsymbol). */
  needsAccess?: boolean;
}

export const buildingTypes = {
  testHall: { id: 'testHall', name: 'testHall', width: 8, depth: 6, height: 2.5 },
  /**
   * Export-Ausfahrt: nimmt Ware an und verkauft sie (ab T1.4).
   * Entscheidung 07.10.2026: frei platzierbar, muss am Geländerand stehen.
   */
  exportExit: {
    id: 'exportExit',
    name: 'exportExit',
    width: 4,
    depth: 4,
    height: 1.6,
    atEdge: true,
    needsAccess: true,
  },
} as const satisfies Record<string, BuildingType>;

export type BuildingTypeId = keyof typeof buildingTypes;
