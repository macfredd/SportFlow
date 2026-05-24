import type {
  TrackPointChartDetailPublicDto,
  TrackPointChartPublicDto,
} from '../../../shared/models/activity.model';
import { formatPacePerDistanceUnit } from './activity-display.util';

const METERS_PER_KM = 1000;
const METERS_PER_MI = 1609.344;

export interface ActivitySplitRow {
  readonly index: number;
  /** Split length in the user's distance unit (1 for full splits; e.g. 0.5 for the last partial). */
  readonly distanceInUnit: number;
  readonly paceFormatted: string | null;
  /** Net elevation change in meters (gain − loss). */
  readonly elevationNetMeters: number | null;
  readonly avgHeartRate: number | null;
  readonly isPartial: boolean;
}

export interface ActivitySplitsViewModel {
  readonly distanceUnit: 'km' | 'mi';
  readonly rows: readonly ActivitySplitRow[];
}

function metersPerUnit(unit: 'km' | 'mi'): number {
  return unit === 'km' ? METERS_PER_KM : METERS_PER_MI;
}

function parseTimeMs(iso: string): number | null {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function interpolateTimeAtDistance(
  points: readonly TrackPointChartDetailPublicDto[],
  targetMeters: number,
): number | null {
  if (points.length === 0) {
    return null;
  }

  const first = points[0];
  if (targetMeters <= first.accumulated_distance_meters) {
    return parseTimeMs(first.date_time);
  }

  const last = points[points.length - 1];
  if (targetMeters >= last.accumulated_distance_meters) {
    return parseTimeMs(last.date_time);
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const d0 = prev.accumulated_distance_meters;
    const d1 = curr.accumulated_distance_meters;
    if (targetMeters > d1) {
      continue;
    }

    const t0 = parseTimeMs(prev.date_time);
    const t1 = parseTimeMs(curr.date_time);
    if (t0 === null || t1 === null) {
      return t0 ?? t1;
    }
    if (d1 <= d0) {
      return t0;
    }

    const ratio = (targetMeters - d0) / (d1 - d0);
    return t0 + ratio * (t1 - t0);
  }

  return null;
}

function elevationStatsInSplit(
  points: readonly TrackPointChartDetailPublicDto[],
  startMeters: number,
  endMeters: number,
): { gain: number; loss: number; hasData: boolean } {
  let gain = 0;
  let loss = 0;
  let hasData = false;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const d = curr.accumulated_distance_meters;

    if (d <= startMeters) {
      continue;
    }
    if (prev.accumulated_distance_meters >= endMeters) {
      break;
    }

    const alt0 = prev.altitude_meters;
    const alt1 = curr.altitude_meters;
    if (alt0 == null || alt1 == null) {
      continue;
    }

    hasData = true;
    const delta = alt1 - alt0;
    if (delta > 0) {
      gain += delta;
    } else if (delta < 0) {
      loss += -delta;
    }
  }

  return { gain, loss, hasData };
}

function avgHeartRateInSplit(
  points: readonly TrackPointChartDetailPublicDto[],
  startTimeMs: number,
  endTimeMs: number,
): number | null {
  let weightedSum = 0;
  let totalSec = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const t0 = parseTimeMs(prev.date_time);
    const t1 = parseTimeMs(curr.date_time);
    if (t0 === null || t1 === null) {
      continue;
    }
    if (t1 <= startTimeMs || t0 >= endTimeMs) {
      continue;
    }

    const overlapStart = Math.max(t0, startTimeMs);
    const overlapEnd = Math.min(t1, endTimeMs);
    const dtSec = (overlapEnd - overlapStart) / 1000;
    if (dtSec <= 0) {
      continue;
    }

    const hr0 = prev.heart_rate;
    const hr1 = curr.heart_rate;
    if (
      hr0 == null ||
      hr1 == null ||
      !Number.isFinite(hr0) ||
      !Number.isFinite(hr1) ||
      hr0 <= 0 ||
      hr1 <= 0
    ) {
      continue;
    }

    weightedSum += ((hr0 + hr1) / 2) * dtSec;
    totalSec += dtSec;
  }

  return totalSec > 0 ? Math.round(weightedSum / totalSec) : null;
}

function roundDistanceInUnit(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Builds per-unit splits (km or mi) from chart track points.
 * Pace uses elapsed time between interpolated distance boundaries.
 */
export function buildActivitySplitsViewModel(
  chart: TrackPointChartPublicDto | null,
): ActivitySplitsViewModel | null {
  const points = chart?.track_points ?? [];
  if (points.length < 2) {
    return null;
  }

  const unit = chart?.preferred_distance_unit ?? 'km';
  const splitLengthM = metersPerUnit(unit);
  const totalMeters = points[points.length - 1]?.accumulated_distance_meters ?? 0;

  if (!(totalMeters > 0)) {
    return null;
  }

  const splitCount = Math.ceil(totalMeters / splitLengthM);
  const rows: ActivitySplitRow[] = [];

  for (let i = 0; i < splitCount; i++) {
    const startM = i * splitLengthM;
    const endM = Math.min((i + 1) * splitLengthM, totalMeters);
    const segmentMeters = endM - startM;

    if (segmentMeters <= 0) {
      continue;
    }

    const startTime = interpolateTimeAtDistance(points, startM);
    const endTime = interpolateTimeAtDistance(points, endM);
    const durationSec =
      startTime !== null && endTime !== null && endTime > startTime
        ? (endTime - startTime) / 1000
        : null;

    const distanceInUnit = roundDistanceInUnit(segmentMeters / splitLengthM);
    const paceFormatted =
      durationSec !== null
        ? formatPacePerDistanceUnit(durationSec, distanceInUnit)
        : null;

    const { gain, loss, hasData } = elevationStatsInSplit(points, startM, endM);
    const avgHeartRate =
      startTime !== null && endTime !== null
        ? avgHeartRateInSplit(points, startTime, endTime)
        : null;

    rows.push({
      index: i + 1,
      distanceInUnit,
      paceFormatted,
      elevationNetMeters: hasData ? Math.round(gain - loss) : null,
      avgHeartRate,
      isPartial: segmentMeters < splitLengthM - 0.5,
    });
  }

  return rows.length > 0 ? { distanceUnit: unit, rows } : null;
}
