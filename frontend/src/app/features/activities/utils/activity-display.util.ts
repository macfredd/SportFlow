import type { ActivityDetailSpeedUnit } from '../../../shared/models/activity.model';

export function isMissingHeartRate(value: number | null | undefined): boolean {
  return value == null || !Number.isFinite(value) || value <= 0;
}

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

/**
 * Pace as time per displayed distance unit (e.g. min/km or min/mi). `M:SS` or `H:MM:SS` if over an hour.
 */
export function formatPacePerDistanceUnit(durationSeconds: number, distanceValue: number): string | null {
  if (distanceValue <= 0 || durationSeconds < 0) return null;
  const secPerUnit = durationSeconds / distanceValue;
  const totalSec = Math.floor(secPerUnit);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
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

/** Transloco key under `units.speed.*` for activity detail speed fields. */
export function activityDetailSpeedUnitKey(unit: ActivityDetailSpeedUnit): string {
  switch (unit) {
    case 'kmh':
      return 'units.speed.kmh';
    case 'mph':
      return 'units.speed.mph';
    default:
      return 'units.speed.kmh';
  }
}

