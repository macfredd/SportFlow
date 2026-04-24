import { ParsedTrackPoint } from '../dto/parsed-track-point.dto';
import { haversineDistanceMeters } from './geo-distance.helper';

const DEFAULT_MIN_DELTA_SECONDS = 0.35;
/** Drop segment speeds above this (m/s) as GPS/timestamp outliers (~200 km/h). */
const DEFAULT_MAX_SEGMENT_SPEED_MS = 55;

/** ~59 km/h — segment peaks above this are treated as GPS noise (Strava-like filtering for typical MTB/road). */
const CYCLING_SEGMENT_CAP_MPS = 16.5;
/** Fallback when track-based max is unavailable; clamps corrupt FIT session summaries. */
const CYCLING_SESSION_ABS_CAP_MPS = 17;

const RUNNING_SEGMENT_CAP_MPS = 12;
const RUNNING_SESSION_ABS_CAP_MPS = 12;

const WALKING_SEGMENT_CAP_MPS = 6;
const WALKING_SESSION_ABS_CAP_MPS = 6;

function roundSpeed2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Per-sport caps for segment max speed and for session summary fallback (m/s).
 * FIT `session.max_speed` is often inflated; GPS-derived max uses `segmentCapMps`.
 */
export function getSpeedStatsCapsForSport(sportRaw: string): {
  segmentCapMps: number;
  sessionAbsCapMps: number;
} {
  const s = sportRaw.toLowerCase();

  if (
    s.includes('cycl') ||
    s.includes('bike') ||
    s.includes('bmx') ||
    s.includes('mountain') ||
    s.includes('gravel')
  ) {
    return {
      segmentCapMps: CYCLING_SEGMENT_CAP_MPS,
      sessionAbsCapMps: CYCLING_SESSION_ABS_CAP_MPS,
    };
  }
  if (s.includes('run') || s.includes('trail')) {
    return {
      segmentCapMps: RUNNING_SEGMENT_CAP_MPS,
      sessionAbsCapMps: RUNNING_SESSION_ABS_CAP_MPS,
    };
  }
  if (s.includes('walk') || s.includes('hike')) {
    return {
      segmentCapMps: WALKING_SEGMENT_CAP_MPS,
      sessionAbsCapMps: WALKING_SESSION_ABS_CAP_MPS,
    };
  }
  return {
    segmentCapMps: DEFAULT_MAX_SEGMENT_SPEED_MS,
    sessionAbsCapMps: DEFAULT_MAX_SEGMENT_SPEED_MS,
  };
}

/**
 * Prefer GPS-derived peak speed when available; otherwise clamped session max (m/s).
 */
export function resolveActivityMaxSpeedMps(
  sessionMps: number | null | undefined,
  gpsMps: number | null | undefined,
  sessionAbsCapMps: number,
): number | null {
  const gps =
    gpsMps != null && Number.isFinite(gpsMps) && gpsMps > 0 ? roundSpeed2(gpsMps) : null;
  if (gps != null) {
    return Math.min(gps, sessionAbsCapMps);
  }

  if (sessionMps == null || !Number.isFinite(sessionMps) || sessionMps <= 0) {
    return null;
  }
  return roundSpeed2(Math.min(sessionMps, sessionAbsCapMps));
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

/**
 * FIT session: prefer `total_distance / total_timer_time` (moving time), same idea as Strava avg speed.
 * Falls back to device `avg_speed`, then distance/elapsed.
 */
export function averageSpeedFromFitSessionFields(input: {
  totalDistanceMeters: number | null | undefined;
  totalTimerTimeSeconds: number | null | undefined;
  totalElapsedTimeSeconds: number | null | undefined;
  sessionAvgSpeedMps: number | null | undefined;
}): number | null {
  const d =
    input.totalDistanceMeters != null ? Number(input.totalDistanceMeters) : null;
  const timer =
    input.totalTimerTimeSeconds != null
      ? Number(input.totalTimerTimeSeconds)
      : null;
  const elapsed =
    input.totalElapsedTimeSeconds != null
      ? Number(input.totalElapsedTimeSeconds)
      : null;
  const sessionAvg =
    input.sessionAvgSpeedMps != null
      ? Number(input.sessionAvgSpeedMps)
      : null;

  if (d != null && Number.isFinite(d) && d > 0 && timer != null && timer > 0) {
    return roundSpeed2(d / timer);
  }
  if (sessionAvg != null && Number.isFinite(sessionAvg) && sessionAvg > 0) {
    return roundSpeed2(sessionAvg);
  }
  if (d != null && Number.isFinite(d) && d > 0 && elapsed != null && elapsed > 0) {
    return roundSpeed2(d / elapsed);
  }
  return null;
}

export interface MovingTimeEstimateOptions {
  /** Minimum segment length (m) to count as motion (handles slow pace + GPS cadence). */
  minDistM: number;
  /** Minimum implied speed (m/s) to count as motion. */
  minSpeedMps: number;
  /** Skip intervals longer than this (s); avoids counting signal dropouts as one “move”. */
  maxSegmentDt: number;
}

/**
 * Thresholds for “moving” between track points: walking is much slower than cycling.
 * (FIT/GPX `sport` string from file, same style as `getSpeedStatsCapsForSport`.)
 */
export function getMovingTimeEstimateOptionsForSport(
  sportRaw: string,
): MovingTimeEstimateOptions {
  const s = sportRaw.toLowerCase();

  if (s.includes('walk') || s.includes('hike')) {
    return {
      minDistM: 1.2,
      minSpeedMps: 0.15,
      maxSegmentDt: 120,
    };
  }
  if (s.includes('run') || s.includes('trail')) {
    return {
      minDistM: 2,
      minSpeedMps: 0.55,
      maxSegmentDt: 90,
    };
  }
  if (
    s.includes('cycl') ||
    s.includes('bike') ||
    s.includes('bmx') ||
    s.includes('mountain') ||
    s.includes('gravel')
  ) {
    return {
      minDistM: 2.5,
      minSpeedMps: 0.35,
      maxSegmentDt: 90,
    };
  }
  return {
    minDistM: 2.5,
    minSpeedMps: 0.35,
    maxSegmentDt: 90,
  };
}

/**
 * Strava-like moving time: sum intervals between fixes where the device clearly moved.
 * Excludes long sits / auto-pause drift when timer_time is missing or ≈ elapsed.
 */
export function estimateMovingTimeSecondsFromTrackPoints(
  points: ParsedTrackPoint[],
  sportOrOptions?: string | MovingTimeEstimateOptions,
): number | null {
  if (points.length < 2) return null;

  const opts: MovingTimeEstimateOptions =
    typeof sportOrOptions === 'string'
      ? getMovingTimeEstimateOptionsForSport(sportOrOptions)
      : sportOrOptions ?? getMovingTimeEstimateOptionsForSport('');

  let moving = 0;

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

    let dtSeconds = (p1.timestamp.getTime() - p0.timestamp.getTime()) / 1000;
    if (!Number.isFinite(dtSeconds) || dtSeconds < DEFAULT_MIN_DELTA_SECONDS) {
      continue;
    }
    if (dtSeconds > opts.maxSegmentDt) {
      continue;
    }

    const dist = haversineDistanceMeters(
      p0.latitude,
      p0.longitude,
      p1.latitude,
      p1.longitude,
    );
    if (!Number.isFinite(dist) || dist < 0) continue;

    const speed = dist / dtSeconds;
    if (dist >= opts.minDistM || speed >= opts.minSpeedMps) {
      moving += dtSeconds;
    }
  }

  if (moving < DEFAULT_MIN_DELTA_SECONDS) return null;
  return Math.round(moving);
}

/**
 * FIT average speed (m/s): use device `total_timer_time` when it is clearly shorter than
 * elapsed (auto-pause). Otherwise prefer GPS-derived moving time so avg speed matches
 * services that exclude rest (e.g. Strava) when the file only has wall-clock time.
 */
export function resolveFitAverageSpeedMps(input: {
  sportRaw: string;
  totalDistanceMeters: number | null | undefined;
  totalTimerTimeSeconds: number | null | undefined;
  totalElapsedTimeSeconds: number | null | undefined;
  sessionAvgSpeedMps: number | null | undefined;
  trackPoints: ParsedTrackPoint[];
}): number | null {
  const sessionBased = averageSpeedFromFitSessionFields({
    totalDistanceMeters: input.totalDistanceMeters,
    totalTimerTimeSeconds: input.totalTimerTimeSeconds,
    totalElapsedTimeSeconds: input.totalElapsedTimeSeconds,
    sessionAvgSpeedMps: input.sessionAvgSpeedMps,
  });

  const d =
    input.totalDistanceMeters != null
      ? Number(input.totalDistanceMeters)
      : null;
  if (d == null || !Number.isFinite(d) || d <= 0) {
    return sessionBased;
  }

  const timer =
    input.totalTimerTimeSeconds != null
      ? Number(input.totalTimerTimeSeconds)
      : null;
  const elapsed =
    input.totalElapsedTimeSeconds != null
      ? Number(input.totalElapsedTimeSeconds)
      : null;

  const deviceMovingTimeLooksValid =
    timer != null &&
    timer > 0 &&
    elapsed != null &&
    elapsed > 0 &&
    timer < elapsed - 30;

  if (deviceMovingTimeLooksValid) {
    return roundSpeed2(d / timer);
  }

  const movingSec = estimateMovingTimeSecondsFromTrackPoints(
    input.trackPoints,
    input.sportRaw,
  );
  if (movingSec != null && movingSec >= 30) {
    return roundSpeed2(d / movingSec);
  }

  return sessionBased;
}

/** Average speed from total distance and GPS-estimated moving seconds (GPX / fallback). */
export function averageSpeedFromDistanceAndMovingTime(
  distanceMeters: number | null | undefined,
  movingSeconds: number | null | undefined,
): number | null {
  if (distanceMeters == null || movingSeconds == null) return null;
  const d = Number(distanceMeters);
  const m = Number(movingSeconds);
  if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(m) || m < 30) {
    return null;
  }
  return roundSpeed2(d / m);
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
