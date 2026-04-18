export type DistanceUnitCode = 'km' | 'mi';

export type UserHeightPublic =
  | { unit: 'cm'; value: number }
  | { unit: 'm'; value: number }
  | { unit: 'in'; feet: number; inches: number };

type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

function totalSecondsToInt(raw: number | null | undefined): number {
  if (raw == null) return 0;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Activity duration for compact sidebar copy (omits zero parts; seconds padded when &lt; 10).
 * Mirrors backend rules that used to live in `formatDurationDisplayEs`.
 */
export function formatDurationCompactDisplay(
  totalSeconds: number | null | undefined,
  t: TranslateFn,
): string {
  const s = Math.max(0, Math.floor(totalSecondsToInt(totalSeconds)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h > 0) {
    parts.push(
      t(h === 1 ? 'units.duration.hoursOne' : 'units.duration.hoursOther', { count: h }),
    );
  }
  if (m > 0) {
    parts.push(t('units.duration.minutes', { count: m }));
  }
  if (sec > 0) {
    const secStr = sec < 10 ? String(sec).padStart(2, '0') : String(sec);
    parts.push(t('units.duration.secondPart', { value: secStr }));
  }
  if (parts.length === 0) {
    return t('units.duration.zero');
  }
  return parts.join(' ');
}

export function formatDistanceDisplay(value: number, unit: DistanceUnitCode, t: TranslateFn): string {
  const rounded = value.toFixed(2);
  const unitKey = unit === 'km' ? 'units.distance.km' : 'units.distance.mi';
  return `${rounded} ${t(unitKey)}`;
}

export function formatHeightDisplay(height: UserHeightPublic, t: TranslateFn): string {
  switch (height.unit) {
    case 'cm':
      return `${Math.round(height.value)} ${t('units.height.cm')}`;
    case 'm': {
      const text = height.value.toFixed(2).replace(/\.?0+$/, '');
      return `${text} ${t('units.height.m')}`;
    }
    case 'in':
      return `${height.feet} ${t('units.height.ft')} ${height.inches} ${t('units.height.in')}`;
    default:
      return '';
  }
}
