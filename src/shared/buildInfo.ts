import { formatDateDe } from './format';

export interface BuildInfo {
  /** Versionsnummer aus package.json, z. B. „0.1.0“. */
  version: string;
  /** Build-Zeitpunkt als ISO-Zeitstempel. */
  date: string;
  /** Kurz-Commit (7 Zeichen) oder „lokal“. */
  commit: string;
}

/** Werte des aktuellen Builds, eingesetzt von Vite (siehe vite.config.ts). */
export const BUILD_INFO: BuildInfo = {
  version: __APP_VERSION__,
  date: __BUILD_DATE__,
  commit: __BUILD_COMMIT__,
};

/** Anzeige-Text, z. B. „v0.1.0 · 07.10.2026 · a1b2c3d“. */
export function formatBuildLabel(info: BuildInfo): string {
  return `v${info.version} · ${formatDateDe(info.date)} · ${info.commit}`;
}
