import type { TrackPointChartDetailPublicDto } from '../../../shared/models/activity.model';

/** When date of birth is unknown: assumed max HR (≈ age 30 under 220 − age). */
export const DEFAULT_ESTIMATED_MAX_HR_BPM = 190;

export interface HeartRateZonesViewModel {
  readonly estimatedMaxBpm: number;
  /** True when `date_of_birth` was missing or invalid and default max HR was used. */
  readonly usedDefaultMax: boolean;
  /** Time share in each zone (0–4), integers summing to 100. */
  readonly zonePercents: readonly [number, number, number, number, number];
}

export function ageAtReferenceDate(
  dateOfBirthIso: string,
  referenceIso: string,
): number | null {
  const birth = new Date(dateOfBirthIso);
  const ref = new Date(referenceIso);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) {
    return null;
  }
  let age = ref.getUTCFullYear() - birth.getUTCFullYear();
  const m = ref.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < birth.getUTCDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

export function estimateMaxHeartRateBpm(ageYears: number | null): number {
  if (ageYears === null) {
    return DEFAULT_ESTIMATED_MAX_HR_BPM;
  }
  const raw = 220 - ageYears;
  return Math.round(Math.min(220, Math.max(100, raw)));
}

function zoneIndexForHeartRate(hr: number, maxHr: number): number {
  const p = hr / maxHr;
  if (p < 0.6) {
    return 0;
  }
  if (p < 0.7) {
    return 1;
  }
  if (p < 0.8) {
    return 2;
  }
  if (p < 0.9) {
    return 3;
  }
  return 4;
}

function toIntegerPercents(
  zoneSeconds: readonly [number, number, number, number, number],
): [number, number, number, number, number] {
  const t = zoneSeconds.reduce((a, b) => a + b, 0);
  if (t <= 0) {
    return [0, 0, 0, 0, 0];
  }
  const exact = zoneSeconds.map((p) => (100 * p) / t);
  const floors = exact.map((x) => Math.floor(x));
  let rem = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r);
  const out = [...floors] as [number, number, number, number, number];
  for (let k = 0; k < rem; k++) {
    out[order[k % order.length].i]++;
  }
  return out;
}

/**
 * Time-weighted zone shares from track points with `date_time` and `heart_rate`.
 * Segments use the mean HR of the two endpoints; invalid segments are skipped.
 */
export function buildHeartRateZonesViewModel(
  activityStartIso: string,
  dateOfBirthIso: string | null | undefined,
  trackPoints: readonly TrackPointChartDetailPublicDto[],
): HeartRateZonesViewModel | null {
  const withTime = trackPoints
    .filter(
      (p) =>
        p.heart_rate != null &&
        typeof p.date_time === 'string' &&
        p.date_time.trim().length > 0,
    )
    .map((p) => ({
      hr: p.heart_rate as number,
      at: new Date(p.date_time).getTime(),
    }))
    .filter((p) => Number.isFinite(p.at));

  if (withTime.length < 2) {
    return null;
  }

  withTime.sort((a, b) => a.at - b.at);

  const age = dateOfBirthIso?.trim()
    ? ageAtReferenceDate(dateOfBirthIso, activityStartIso)
    : null;
  const usedDefaultMax = age === null;
  const maxHr = estimateMaxHeartRateBpm(age);

  const zoneSeconds = [0, 0, 0, 0, 0] as [number, number, number, number, number];

  for (let i = 0; i < withTime.length - 1; i++) {
    const a = withTime[i];
    const b = withTime[i + 1];
    const dtSec = (b.at - a.at) / 1000;
    if (!(dtSec > 0 && dtSec < 3600)) {
      continue;
    }
    const hrMean = (a.hr + b.hr) / 2;
    const z = zoneIndexForHeartRate(hrMean, maxHr);
    zoneSeconds[z] += dtSec;
  }

  const totalSec = zoneSeconds.reduce((s, x) => s + x, 0);
  if (totalSec <= 0) {
    return null;
  }

  const zonePercents = toIntegerPercents(zoneSeconds);

  return {
    estimatedMaxBpm: maxHr,
    usedDefaultMax,
    zonePercents,
  };
}
