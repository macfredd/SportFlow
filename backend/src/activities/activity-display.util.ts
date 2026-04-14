import { DistanceUnit } from '../users/enums';

/** Coerce DB decimal / string to number. */
function toNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * `duration_seconds` → Spanish display: omit zero parts; `1 Hr` / `2 Hrs`; `Min` / `seg` fixed labels.
 * Seconds use two digits when under 10 (e.g. `07 seg`). Same rules as the activities UI (frontend).
 */
export function formatDurationDisplayEs(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(toNumber(totalSeconds) ?? 0));
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

/**
 * `duration_seconds` → `HH:MM:SS` (fixed width; hours may exceed 24). For tables and dense UIs.
 */
export function formatDurationHms(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(toNumber(totalSeconds) ?? 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export interface DistancePublicShape {
  display: string;
  unit: DistanceUnit;
}

/**
 * Distance from stored meters, using the user's preferred unit (same idea as height).
 */
export function buildDistanceForPublic(
  distanceMetersRaw: unknown,
  preferredUnit: DistanceUnit,
): DistancePublicShape | null {
  const meters = toNumber(distanceMetersRaw);
  if (meters === null) return null;

  switch (preferredUnit) {
    case DistanceUnit.KM: {
      const km = meters / 1000;
      return { display: `${km.toFixed(2)} km`, unit: preferredUnit };
    }
    case DistanceUnit.MI: {
      const mi = meters * 0.000621371192;
      return { display: `${mi.toFixed(2)} mi`, unit: preferredUnit };
    }
  }
}

function utcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function fullMonthsBetweenUtc(start: Date, end: Date): number {
  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

function fullDaysBetweenUtcMidnight(start: Date, end: Date): number {
  const a = utcMidnight(start);
  const b = utcMidnight(end);
  return Math.floor((b - a) / 86400000);
}

/**
 * Relative label for `start_time` vs `now` (Spanish, for UI).
 */
export function buildRelativeActivityStartEs(startTime: Date, now: Date = new Date()): string {
  const start = startTime instanceof Date ? startTime : new Date(startTime);
  const diffMs = now.getTime() - start.getTime();

  if (diffMs < 0) {
    return 'Hace un momento';
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffSec / 3600);

  const dayDiff = fullDaysBetweenUtcMidnight(start, now);

  if (dayDiff === 0) {
    if (diffMin < 1) {
      return 'Hace menos de un minuto';
    }
    if (diffHr < 1) {
      return diffMin === 1 ? 'Hace 1 minuto' : `Hace ${diffMin} minutos`;
    }
    return diffHr === 1 ? 'Hace 1 hora' : `Hace ${diffHr} horas`;
  }

  if (dayDiff === 1) {
    return 'Hace 1 día';
  }

  if (dayDiff >= 2 && dayDiff < 30) {
    return `Hace ${dayDiff} días`;
  }

  const totalMonths = fullMonthsBetweenUtc(start, now);

  if (dayDiff >= 30) {
    if (totalMonths >= 12) {
      const years = Math.floor(totalMonths / 12);
      const remMonths = totalMonths % 12;
      const yLabel = years === 1 ? '1 año' : `${years} años`;
      if (remMonths === 0) {
        return `Hace ${yLabel}`;
      }
      const mLabel = remMonths === 1 ? '1 mes' : `${remMonths} meses`;
      return `Hace ${yLabel} y ${mLabel}`;
    }
    const m = Math.max(1, totalMonths);
    return m === 1 ? 'Hace 1 mes' : `Hace ${m} meses`;
  }

  return 'Hace un momento';
}
