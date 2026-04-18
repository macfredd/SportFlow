export function toNumber(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  return typeof value === 'number' ? value : Number(value);
}

/** `duration_seconds` → `HH:MM:SS` (fixed width; hours may exceed 24). For tables and dense UIs. */
export function formatDurationHms(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(toNumber(totalSeconds)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

/** Translation keys under `activity.*` for known sport types. */
export function sportTypeLabelKey(sport: string): string {
  switch (sport) {
    case 'walking':
      return 'activity.walking';
    case 'running':
      return 'activity.running';
    case 'cycling':
      return 'activity.cycling';
    default:
      return 'activity.unknown';
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
