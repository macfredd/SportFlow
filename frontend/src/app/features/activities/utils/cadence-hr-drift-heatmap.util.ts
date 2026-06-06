import type { SportType, TrackPointChartPublicDto } from '@shared/models/activity.model';
import {
  formatElapsedActivityTime,
  isMissingHeartRate,
} from '@features/activities/utils/activity-display.util';
import {
  CADENCE_HR_DRIFT_MAX_BINS,
  CADENCE_HR_DRIFT_MIN_BINS,
  CADENCE_HR_DRIFT_TARGET_POINTS_PER_BIN,
  CADENCE_SPEED_HEATMAP_CADENCE_BUCKET,
} from './cadence-metrics.constants';
import type { CadenceUnit } from './cadence-metrics.util';
import { formatCadenceBinRangeLabel } from './cadence-speed-heatmap.util';

export interface CadenceHrDriftHeatmapCellMeta {
  readonly elapsedStartSec: number;
  readonly elapsedEndSec: number;
  readonly cadenceMin: number;
  readonly cadenceMax: number;
  readonly avgHr: number;
  readonly count: number;
  readonly timeSec: number;
}

export interface CadenceHrDriftHeatmapViewModel {
  readonly unit: CadenceUnit;
  readonly cadenceBucket: number;
  readonly timeBinCount: number;
  readonly totalDurationSec: number;
  readonly timeBinLabels: readonly string[];
  readonly cadenceBinLabels: readonly string[];
  /** [timeBinIndex, cadenceBinIndex, avgHeartRateBpm]. */
  readonly data: readonly [number, number, number][];
  readonly cellMeta: ReadonlyMap<string, CadenceHrDriftHeatmapCellMeta>;
  readonly minHr: number;
  readonly maxHr: number;
}

interface MutableDriftCell {
  sumHr: number;
  count: number;
  timeSec: number;
}

function cadenceUnitForSport(sportType: SportType): CadenceUnit {
  return sportType === 'cycling' ? 'rpm' : 'spm';
}

function isValidCadence(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

function isValidHeartRate(value: number | null): value is number {
  return !isMissingHeartRate(value);
}

function parseTimeMs(iso: string): number | null {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function bucketLower(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

function bucketIndex(value: number, origin: number, step: number): number {
  return Math.round((bucketLower(value, step) - origin) / step);
}

function cellKey(xIndex: number, yIndex: number): string {
  return `${xIndex},${yIndex}`;
}

function resolveTimeBinCount(pointCount: number): number {
  const byDensity = Math.round(pointCount / CADENCE_HR_DRIFT_TARGET_POINTS_PER_BIN);
  return Math.max(
    CADENCE_HR_DRIFT_MIN_BINS,
    Math.min(CADENCE_HR_DRIFT_MAX_BINS, byDensity),
  );
}

/**
 * Time (X) × cadence (Y) with average heart rate per cell — cardiac drift over the activity.
 */
export function buildCadenceHrDriftHeatmapViewModel(
  chart: TrackPointChartPublicDto | null,
  sportType: SportType | undefined,
): CadenceHrDriftHeatmapViewModel | null {
  const points = chart?.track_points ?? [];
  if (points.length === 0 || !sportType) {
    return null;
  }

  const cadenceStep = CADENCE_SPEED_HEATMAP_CADENCE_BUCKET;
  const startMs = parseTimeMs(points[0].date_time);
  if (startMs === null) {
    return null;
  }

  const samples: { elapsedSec: number; cadence: number; hr: number }[] = [];
  let minCadence = Infinity;
  let maxCadence = -Infinity;
  let minHr = Infinity;
  let maxHr = -Infinity;
  let lastElapsedSec = 0;

  for (const point of points) {
    const cadence = point.cadence;
    const hr = point.heart_rate;
    if (!isValidCadence(cadence) || !isValidHeartRate(hr)) {
      continue;
    }
    const atMs = parseTimeMs(point.date_time);
    if (atMs === null) {
      continue;
    }
    const elapsedSec = Math.max(0, (atMs - startMs) / 1000);
    lastElapsedSec = Math.max(lastElapsedSec, elapsedSec);
    samples.push({ elapsedSec, cadence, hr });
    if (cadence < minCadence) {
      minCadence = cadence;
    }
    if (cadence > maxCadence) {
      maxCadence = cadence;
    }
    if (hr < minHr) {
      minHr = hr;
    }
    if (hr > maxHr) {
      maxHr = hr;
    }
  }

  if (samples.length === 0) {
    return null;
  }

  const totalDurationSec = lastElapsedSec > 0 ? lastElapsedSec : 1;
  const timeBinCount = resolveTimeBinCount(samples.length);
  const cadenceOrigin = bucketLower(minCadence, cadenceStep);
  const cadenceEnd = bucketLower(maxCadence, cadenceStep) + cadenceStep;
  const cadenceBinCount = Math.max(1, Math.round((cadenceEnd - cadenceOrigin) / cadenceStep));

  const cells = new Map<string, MutableDriftCell>();

  for (const sample of samples) {
    const ratio = Math.min(1, Math.max(0, sample.elapsedSec / totalDurationSec));
    const timeIdx = Math.min(timeBinCount - 1, Math.floor(ratio * timeBinCount));
    const cadenceIdx = bucketIndex(sample.cadence, cadenceOrigin, cadenceStep);
    if (cadenceIdx < 0 || cadenceIdx >= cadenceBinCount) {
      continue;
    }
    const key = cellKey(timeIdx, cadenceIdx);
    const cell = cells.get(key) ?? { sumHr: 0, count: 0, timeSec: 0 };
    cell.sumHr += sample.hr;
    cell.count += 1;
    cells.set(key, cell);
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const t0 = parseTimeMs(prev.date_time);
    const t1 = parseTimeMs(curr.date_time);
    if (t0 === null || t1 === null) {
      continue;
    }
    const dtSec = (t1 - t0) / 1000;
    if (dtSec <= 0) {
      continue;
    }
    const elapsedSec = Math.max(0, (t1 - startMs) / 1000);
    const cadence = curr.cadence;
    const hr = curr.heart_rate;
    if (!isValidCadence(cadence) || !isValidHeartRate(hr)) {
      continue;
    }
    const ratio = Math.min(1, Math.max(0, elapsedSec / totalDurationSec));
    const timeIdx = Math.min(timeBinCount - 1, Math.floor(ratio * timeBinCount));
    const cadenceIdx = bucketIndex(cadence, cadenceOrigin, cadenceStep);
    if (cadenceIdx < 0 || cadenceIdx >= cadenceBinCount) {
      continue;
    }
    const key = cellKey(timeIdx, cadenceIdx);
    const cell = cells.get(key);
    if (cell) {
      cell.timeSec += dtSec;
    }
  }

  const unit = cadenceUnitForSport(sportType);
  const timeBinLabels: string[] = [];
  for (let i = 0; i < timeBinCount; i++) {
    const start = (i / timeBinCount) * totalDurationSec;
    const end = ((i + 1) / timeBinCount) * totalDurationSec;
    timeBinLabels.push(`${formatElapsedActivityTime(start)}–${formatElapsedActivityTime(end)}`);
  }

  const cadenceBinLabels: string[] = [];
  for (let i = 0; i < cadenceBinCount; i++) {
    const low = cadenceOrigin + i * cadenceStep;
    cadenceBinLabels.push(formatCadenceBinRangeLabel(low, cadenceStep, unit));
  }

  const cellMeta = new Map<string, CadenceHrDriftHeatmapCellMeta>();
  const data: [number, number, number][] = [];

  for (const [key, cell] of cells) {
    if (cell.count <= 0) {
      continue;
    }
    const [xStr, yStr] = key.split(',');
    const x = Number(xStr);
    const y = Number(yStr);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    const avgHr = Math.round(cell.sumHr / cell.count);
    data.push([x, y, avgHr]);

    const elapsedStartSec = (x / timeBinCount) * totalDurationSec;
    const elapsedEndSec = ((x + 1) / timeBinCount) * totalDurationSec;
    const cadenceMin = cadenceOrigin + y * cadenceStep;
    cellMeta.set(key, {
      elapsedStartSec,
      elapsedEndSec,
      cadenceMin,
      cadenceMax: cadenceMin + cadenceStep,
      avgHr,
      count: cell.count,
      timeSec: cell.timeSec,
    });
  }

  if (data.length === 0) {
    return null;
  }

  return {
    unit,
    cadenceBucket: cadenceStep,
    timeBinCount,
    totalDurationSec,
    timeBinLabels,
    cadenceBinLabels,
    data,
    cellMeta,
    minHr,
    maxHr,
  };
}
