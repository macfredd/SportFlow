import { ParsedTrackPoint } from '../dto/parsed-track-point.dto';
import { haversineDistanceMeters } from './geo-distance.helper';

const DEFAULT_MIN_DELTA_SECONDS = 0.35;
/** Drop segment speeds above this (m/s) as GPS/timestamp outliers (~200 km/h). */
const DEFAULT_MAX_SEGMENT_SPEED_MS = 55;

function roundSpeed2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Overall average speed (m/s) from path length and elapsed wall-clock duration. */
export function averageSpeedMetersPerSecond(
  distanceMeters: number | null | undefined,
  durationSeconds: number | null | undefined,
): number | null {
  if (
    distanceMeters == null ||
    durationSeconds == null ||
    durationSeconds <= 0
  ) {
    return null;
  }
  return roundSpeed2(distanceMeters / durationSeconds);
}

export interface MaxSpeedOptions {
  minDeltaSeconds?: number;
  maxSegmentSpeedMetersPerSecond?: number;
}

/**
 * Peak speed from consecutive GPS samples: distance / Δtime.
 * Skips tiny Δt and implausible segment speeds.
 */
export function maxSpeedFromTrackPoints(
  points: ParsedTrackPoint[],
  options?: MaxSpeedOptions,
): number | null {
  const minDt =
    options?.minDeltaSeconds ?? DEFAULT_MIN_DELTA_SECONDS;
  const cap = options?.maxSegmentSpeedMetersPerSecond ?? DEFAULT_MAX_SEGMENT_SPEED_MS;

  let peak = 0;
  let found = false;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (
      p0.latitude == null ||
      p0.longitude == null ||
      p1.latitude == null ||
      p1.longitude == null
    ) {
      continue;
    }

    const dtSeconds =
      (p1.timestamp.getTime() - p0.timestamp.getTime()) / 1000;
    if (!Number.isFinite(dtSeconds) || dtSeconds < minDt) continue;

    const dist = haversineDistanceMeters(
      p0.latitude,
      p0.longitude,
      p1.latitude,
      p1.longitude,
    );
    const v = dist / dtSeconds;
    if (!Number.isFinite(v) || v > cap) continue;

    if (v > peak) peak = v;
    found = true;
  }

  if (!found) return null;
  return roundSpeed2(peak);
}
