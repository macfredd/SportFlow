export function toNumber(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  return typeof value === 'number' ? value : Number(value);
}

/**
 * `duration_seconds` → Spanish display: omit zero parts; `1 Hr` / `2 Hrs`; `Min` / `seg` fixed labels.
 * Seconds use two digits when under 10 (e.g. `07 seg`). Kept in sync with the backend helper.
 */
export function formatDurationDisplayEs(
  totalSeconds: number | null | undefined,
): string {
  const s = Math.max(0, Math.floor(toNumber(totalSeconds)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h > 0) {
    parts.push(`${h} ${h === 1 ? 'Hr' : 'Hrs'}`);
  }
  if (m > 0) {
    parts.push(`${m} Min`);
  }
  if (sec > 0) {
    const secStr = sec < 10 ? String(sec).padStart(2, '0') : String(sec);
    parts.push(`${secStr} seg`);
  }
  if (parts.length === 0) {
    return '0 seg';
  }
  return parts.join(' ');
}

/** `duration_seconds` → `HH:MM:SS` (fixed width; hours may exceed 24). For tables and dense UIs. */
export function formatDurationHms(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(toNumber(totalSeconds)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export function sportTypeLabel(sport: string): string {
  switch (sport) {
    case 'walking':
      return 'Walking';
    case 'running':
      return 'Running';
    case 'cycling':
      return 'Cycling';
    default:
      return sport;
  }
}

export function sportTypeIconName(sport: string): string {
  switch (sport) {
    case 'walking':
      return 'directions_walk';
    case 'running':
      return 'directions_run';
    case 'cycling':
      return 'directions_bike';
    default:
      return 'sports';
  }
}

/** Uses `UserConfig.preferred_distance_unit` (`km`, `mi`, …). */
export function formatActivityDistance(
  meters: number,
  preferredUnit: string | undefined | null,
): string {
  const u = (preferredUnit ?? 'km').toLowerCase();
  if (u === 'mi' || u === 'mile' || u === 'miles') {
    return `${(meters * 0.000621371192).toFixed(2)} mi`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}
