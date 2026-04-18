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
