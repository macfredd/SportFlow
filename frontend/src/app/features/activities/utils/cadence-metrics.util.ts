import type {
  SportType,
  TrackPointChartDetailPublicDto,
  TrackPointChartPublicDto,
} from '../../../shared/models/activity.model';
import {
  CADENCE_DISTRIBUTION_MAX_BINS,
  CADENCE_DISTRIBUTION_MIN_BINS,
  CADENCE_DISTRIBUTION_SYMBOL_SIZE,
  CADENCE_DISTRIBUTION_TARGET_POINTS_PER_BIN,
  CADENCE_MAX_SEGMENT_DT_SEC,
  minSpeedMpsForSport,
} from './cadence-metrics.constants';
import {
  defaultCadenceZonesForSport,
  type CadenceZoneDefinition,
  zoneIndexForCadence,
} from './cadence-zones.constants';

export type CadenceUnit = 'spm' | 'rpm';

export interface CadenceMetricsViewModel {
  readonly avgCadence: number | null;
  readonly maxCadence: number | null;
  readonly minCadenceMoving: number | null;
  readonly movingCadence: number | null;
  readonly unit: CadenceUnit;
}

export interface CadenceDistributionPoint {
  readonly elapsedSec: number;
  readonly cadence: number;
  readonly zoneIndex: number;
}

/** Binned X for chart display (compressed time axis + horizontal spread). */
export interface CadenceDistributionPlotPoint {
  readonly displayX: number;
  readonly elapsedSec: number;
  readonly cadence: number;
  readonly zoneIndex: number;
}

export interface CadenceDistributionViewModel {
  readonly unit: CadenceUnit;
  readonly avgCadence: number;
  readonly points: readonly CadenceDistributionPoint[];
  readonly plotPoints: readonly CadenceDistributionPlotPoint[];
  readonly binCount: number;
  readonly zones: readonly CadenceZoneDefinition[];
  readonly yMin: number;
  readonly yMax: number;
  readonly totalDurationSec: number;
}

function cadenceUnitForSport(sportType: SportType): CadenceUnit {
  return sportType === 'cycling' ? 'rpm' : 'spm';
}

function isValidCadence(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

function parseTimeMs(iso: string): number | null {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function isMovingSegment(
  speedPrev: number | null,
  speedCurr: number | null,
  minSpeedMps: number,
): boolean {
  const speeds = [speedPrev, speedCurr].filter(
    (s): s is number => s != null && Number.isFinite(s) && s >= 0,
  );
  if (speeds.length === 0) {
    return false;
  }
  return Math.max(...speeds) >= minSpeedMps;
}

function segmentCadenceMean(
  prev: TrackPointChartDetailPublicDto,
  curr: TrackPointChartDetailPublicDto,
): number | null {
  const c0 = prev.cadence;
  const c1 = curr.cadence;
  if (isValidCadence(c0) && isValidCadence(c1)) {
    return (c0 + c1) / 2;
  }
  if (isValidCadence(c0)) {
    return c0;
  }
  if (isValidCadence(c1)) {
    return c1;
  }
  return null;
}

/**
 * Time-weighted cadence KPIs from chart track points.
 * Returns null when no valid cadence samples exist.
 */
export function buildCadenceMetricsViewModel(
  chart: TrackPointChartPublicDto | null,
  sportType: SportType | undefined,
): CadenceMetricsViewModel | null {
  const points = chart?.track_points ?? [];
  if (points.length < 2 || !sportType) {
    return null;
  }

  const minSpeedMps = minSpeedMpsForSport(sportType);
  let weightedSum = 0;
  let totalSec = 0;
  let movingWeightedSum = 0;
  let movingTotalSec = 0;
  let maxCadence: number | null = null;
  let minMoving: number | null = null;
  let anyValid = false;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const t0 = parseTimeMs(prev.date_time);
    const t1 = parseTimeMs(curr.date_time);
    if (t0 === null || t1 === null) {
      continue;
    }

    const dtSec = (t1 - t0) / 1000;
    if (dtSec <= 0 || dtSec > CADENCE_MAX_SEGMENT_DT_SEC) {
      continue;
    }

    for (const c of [prev.cadence, curr.cadence]) {
      if (isValidCadence(c)) {
        anyValid = true;
        maxCadence = maxCadence === null ? c : Math.max(maxCadence, c);
      }
    }

    const segmentMean = segmentCadenceMean(prev, curr);
    if (segmentMean === null) {
      continue;
    }

    weightedSum += segmentMean * dtSec;
    totalSec += dtSec;

    if (isMovingSegment(prev.speed_m_s, curr.speed_m_s, minSpeedMps)) {
      movingWeightedSum += segmentMean * dtSec;
      movingTotalSec += dtSec;

      for (const c of [prev.cadence, curr.cadence]) {
        if (isValidCadence(c)) {
          minMoving = minMoving === null ? c : Math.min(minMoving, c);
        }
      }
    }
  }

  if (!anyValid) {
    return null;
  }

  return {
    avgCadence: totalSec > 0 ? Math.round(weightedSum / totalSec) : null,
    maxCadence: maxCadence !== null ? Math.round(maxCadence) : null,
    minCadenceMoving: minMoving !== null ? Math.round(minMoving) : null,
    movingCadence: movingTotalSec > 0 ? Math.round(movingWeightedSum / movingTotalSec) : null,
    unit: cadenceUnitForSport(sportType),
  };
}

function resolveDistributionBinCount(pointCount: number): number {
  const byDensity = Math.round(pointCount / CADENCE_DISTRIBUTION_TARGET_POINTS_PER_BIN);
  return Math.max(
    CADENCE_DISTRIBUTION_MIN_BINS,
    Math.min(CADENCE_DISTRIBUTION_MAX_BINS, byDensity),
  );
}

/**
 * Maps raw samples into fixed time bins on X (compressed axis) with horizontal spread
 * so points form dense color bands instead of a thin sequential line.
 */
export function buildCadenceDistributionPlotPoints(
  points: readonly CadenceDistributionPoint[],
  totalDurationSec: number,
): { plotPoints: CadenceDistributionPlotPoint[]; binCount: number } {
  const binCount = resolveDistributionBinCount(points.length);
  const buckets: CadenceDistributionPoint[][] = Array.from({ length: binCount }, () => []);

  const duration = totalDurationSec > 0 ? totalDurationSec : 1;

  for (const point of points) {
    const ratio = Math.min(1, Math.max(0, point.elapsedSec / duration));
    const binIndex = Math.min(binCount - 1, Math.floor(ratio * binCount));
    buckets[binIndex].push(point);
  }

  const plotPoints: CadenceDistributionPlotPoint[] = [];
  const binInnerMargin = 0.06;
  const binInnerWidth = 1 - 2 * binInnerMargin;

  for (let binIndex = 0; binIndex < binCount; binIndex++) {
    const bucket = buckets[binIndex];
    const n = bucket.length;
    if (n === 0) {
      continue;
    }

    for (let i = 0; i < n; i++) {
      const point = bucket[i];
      const slot = n === 1 ? 0.5 : (i + 0.5) / n;
      plotPoints.push({
        displayX: binIndex + binInnerMargin + slot * binInnerWidth,
        elapsedSec: point.elapsedSec,
        cadence: point.cadence,
        zoneIndex: point.zoneIndex,
      });
    }
  }

  return {
    plotPoints,
    binCount,
  };
}

/**
 * One scatter point per valid cadence sample (raw track-point readings, not smoothed).
 * Chart uses binned `plotPoints` for display; raw `points` kept for reference.
 */
export function buildCadenceDistributionViewModel(
  chart: TrackPointChartPublicDto | null,
  sportType: SportType | undefined,
): CadenceDistributionViewModel | null {
  const points = chart?.track_points ?? [];
  if (points.length === 0 || !sportType) {
    return null;
  }

  const zones = defaultCadenceZonesForSport(sportType);
  const startMs = parseTimeMs(points[0].date_time);
  if (startMs === null) {
    return null;
  }

  const scatterPoints: CadenceDistributionPoint[] = [];
  let lastElapsedSec = 0;

  for (const point of points) {
    if (!isValidCadence(point.cadence)) {
      continue;
    }
    const atMs = parseTimeMs(point.date_time);
    if (atMs === null) {
      continue;
    }
    const elapsedSec = Math.max(0, (atMs - startMs) / 1000);
    lastElapsedSec = Math.max(lastElapsedSec, elapsedSec);
    scatterPoints.push({
      elapsedSec,
      cadence: point.cadence,
      zoneIndex: zoneIndexForCadence(point.cadence, zones),
    });
  }

  if (scatterPoints.length === 0) {
    return null;
  }

  const cadenceValues = scatterPoints.map((p) => p.cadence);
  const minCadence = Math.min(...cadenceValues);
  const maxCadence = Math.max(...cadenceValues);
  const yPadding = 5;
  const weightedSum = scatterPoints.reduce((sum, p) => sum + p.cadence, 0);
  const { plotPoints, binCount } = buildCadenceDistributionPlotPoints(
    scatterPoints,
    lastElapsedSec,
  );

  return {
    unit: cadenceUnitForSport(sportType),
    avgCadence: Math.round(weightedSum / scatterPoints.length),
    points: scatterPoints,
    plotPoints,
    binCount,
    zones,
    yMin: Math.max(0, Math.floor(minCadence - yPadding)),
    yMax: Math.ceil(maxCadence + yPadding),
    totalDurationSec: lastElapsedSec,
  };
}
