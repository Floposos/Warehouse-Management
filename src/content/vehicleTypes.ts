/**
 * Eigene Fahrzeugtypen (T2.5, Entscheidung 08.10.2026): Transporter und LKW, jeweils als
 * Diesel oder Elektro. Werte in config/vehicles.ts, Namen in ui/texts.
 */
export const vehicleModels = ['van', 'truck'] as const;
export type VehicleModel = (typeof vehicleModels)[number];

/** Entscheidung 08.10.2026: Elektro unterscheidet sich nur bei den Kosten. */
export const vehicleDrives = ['diesel', 'electric'] as const;
export type VehicleDrive = (typeof vehicleDrives)[number];
