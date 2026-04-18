/**
 * Fecha relativa respecto a "ahora" (misma lógica que el antiguo backend).
 * Los textos se resuelven con Transloco vía `translate`.
 */

export type RelativeActivityTranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

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

const PREFIX = 'activity.relativeStart.';

function t(translate: RelativeActivityTranslateFn, key: string, params?: Record<string, string | number>): string {
  return translate(PREFIX + key, params);
}

/**
 * Etiqueta relativa para `start_time` vs `now` (dependiente del idioma vía `translate`).
 */
export function buildRelativeActivityStart(
  startTime: Date | string,
  translate: RelativeActivityTranslateFn,
  now: Date = new Date(),
): string {
  const start = startTime instanceof Date ? startTime : new Date(startTime);
  const diffMs = now.getTime() - start.getTime();

  if (diffMs < 0) {
    return t(translate, 'momentAgo');
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffSec / 3600);

  const dayDiff = fullDaysBetweenUtcMidnight(start, now);

  if (dayDiff === 0) {
    if (diffMin < 1) {
      return t(translate, 'lessThanMinute');
    }
    if (diffHr < 1) {
      return diffMin === 1
        ? t(translate, 'minutesOne')
        : t(translate, 'minutes', { count: diffMin });
    }
    return diffHr === 1 ? t(translate, 'hoursOne') : t(translate, 'hours', { count: diffHr });
  }

  if (dayDiff === 1) {
    return t(translate, 'oneDayAgo');
  }

  if (dayDiff >= 2 && dayDiff < 30) {
    return t(translate, 'daysAgo', { count: dayDiff });
  }

  const totalMonths = fullMonthsBetweenUtc(start, now);

  if (dayDiff >= 30) {
    if (totalMonths >= 12) {
      const years = Math.floor(totalMonths / 12);
      const remMonths = totalMonths % 12;
      const yLabel =
        years === 1 ? t(translate, 'yearOne') : t(translate, 'yearMany', { count: years });
      if (remMonths === 0) {
        return t(translate, 'agoYears', { label: yLabel });
      }
      const mLabel =
        remMonths === 1
          ? t(translate, 'monthOne')
          : t(translate, 'monthMany', { count: remMonths });
      return t(translate, 'agoYearsAndMonths', { years: yLabel, months: mLabel });
    }
    const m = Math.max(1, totalMonths);
    return m === 1 ? t(translate, 'oneMonthAgo') : t(translate, 'monthsAgo', { count: m });
  }

  return t(translate, 'momentAgo');
}
