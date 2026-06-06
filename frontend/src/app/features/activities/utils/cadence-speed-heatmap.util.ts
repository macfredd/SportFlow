import type { SportType, TrackPointChartPublicDto } from '../../../shared/models/activity.model';
import {
  CADENCE_MAX_SEGMENT_DT_SEC,
  CADENCE_SPEED_HEATMAP_CADENCE_BUCKET,
  CADENCE_SPEED_HEATMAP_SPEED_BUCKET_MPS,
} from './cadence-metrics.constants';
import type { CadenceUnit } from './cadence-metrics.util';
import {
  defaultCadenceZonesForSport,
  type CadenceZoneDefinition,
} from './cadence-zones.constants';

export interface CadenceSpeedHeatmapCellMeta {
  readonly speedMin: number;
  readonly speedMax: number;
  readonly cadenceMin: number;
  readonly cadenceMax: number;
  readonly count: number;
  readonly timeSec: number;
  readonly percentOfSamples: number;
  readonly percentOfTime: number;
}

export interface CadenceSpeedHeatmapViewModel {
  readonly unit: CadenceUnit;
  readonly zones: readonly CadenceZoneDefinition[];
  readonly speedBucketMps: number;
  readonly cadenceBucket: number;
  readonly speedBinLabels: readonly string[];
  readonly cadenceBinLabels: readonly string[];
  /** ECharts heatmap tuples: [speedBinIndex, cadenceBinIndex, count]. */
  readonly data: readonly [number, number, number][];
  readonly cellMeta: ReadonlyMap<string, CadenceSpeedHeatmapCellMeta>;
  readonly maxCount: number;
  readonly totalSamples: number;
  readonly totalTimeSec: number;
}

interface MutableCell {
  count: number;
  timeSec: number;
}

function cadenceUnitForSport(sportType: SportType): CadenceUnit {
  return sportType === 'cycling' ? 'rpm' : 'spm';
}

function isValidCadence(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

function isValidSpeed(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value >= 0;
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

function segmentMean(a: number | null, b: number | null): number | null {
  const vals = [a, b].filter((v): v is number => v != null && Number.isFinite(v));
  if (vals.length === 0) {
    return null;
  }
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export function formatSpeedBinRangeLabel(low: number, step: number): string {
  const high = low + step;
  return `${low.toFixed(2)}–${high.toFixed(2)} m/s`;
}

export function formatCadenceBinRangeLabel(
  low: number,
  step: number,
  unit: CadenceUnit,
): string {
  const high = low + step;
  return `${low}–${high} ${unit}`;
}

/**
 * Bins speed (X) and cadence (Y), counting samples and segment time per cell.
 */
export function buildCadenceSpeedHeatmapViewModel(
  chart: TrackPointChartPublicDto | null,
  sportType: SportType | undefined,
  options?: {
    readonly speedBucketMps?: number;
    readonly cadenceBucket?: number;
  },
): CadenceSpeedHeatmapViewModel | null {
  const points = chart?.track_points ?? [];
  if (points.length === 0 || !sportType) {
    return null;
  }

  const speedStep = options?.speedBucketMps ?? CADENCE_SPEED_HEATMAP_SPEED_BUCKET_MPS;
  const cadenceStep = options?.cadenceBucket ?? CADENCE_SPEED_HEATMAP_CADENCE_BUCKET;

  const samples: { speed: number; cadence: number }[] = [];
  let minSpeed = Infinity;
  let maxSpeed = -Infinity;
  let minCadence = Infinity;
  let maxCadence = -Infinity;

  for (const point of points) {
    const cadence = point.cadence;
    const speed = point.speed_m_s;
    if (!isValidCadence(cadence) || !isValidSpeed(speed)) {
      continue;
    }
    samples.push({ speed, cadence });
    if (speed < minSpeed) {
      minSpeed = speed;
    }
    if (speed > maxSpeed) {
      maxSpeed = speed;
    }
    if (cadence < minCadence) {
      minCadence = cadence;
    }
    if (cadence > maxCadence) {
      maxCadence = cadence;
    }
  }

  if (samples.length === 0) {
    return null;
  }

  const speedOrigin = bucketLower(minSpeed, speedStep);
  const speedEnd = bucketLower(maxSpeed, speedStep) + speedStep;
  const cadenceOrigin = bucketLower(minCadence, cadenceStep);
  const cadenceEnd = bucketLower(maxCadence, cadenceStep) + cadenceStep;

  const speedBinCount = Math.max(1, Math.round((speedEnd - speedOrigin) / speedStep));
  const cadenceBinCount = Math.max(1, Math.round((cadenceEnd - cadenceOrigin) / cadenceStep));

  const cells = new Map<string, MutableCell>();

  const ensureCell = (x: number, y: number): MutableCell | null => {
    if (x < 0 || x >= speedBinCount || y < 0 || y >= cadenceBinCount) {
      return null;
    }
    const key = cellKey(x, y);
    const existing = cells.get(key);
    if (existing) {
      return existing;
    }
    const created = { count: 0, timeSec: 0 };
    cells.set(key, created);
    return created;
  };

  for (const sample of samples) {
    const x = bucketIndex(sample.speed, speedOrigin, speedStep);
    const y = bucketIndex(sample.cadence, cadenceOrigin, cadenceStep);
    const cell = ensureCell(x, y);
    if (cell) {
      cell.count += 1;
    }
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
    if (dtSec <= 0 || dtSec > CADENCE_MAX_SEGMENT_DT_SEC) {
      continue;
    }
    const cadence = segmentMean(prev.cadence, curr.cadence);
    const speed = segmentMean(prev.speed_m_s, curr.speed_m_s);
    if (cadence === null || speed === null || !isValidCadence(cadence) || !isValidSpeed(speed)) {
      continue;
    }
    const x = bucketIndex(speed, speedOrigin, speedStep);
    const y = bucketIndex(cadence, cadenceOrigin, cadenceStep);
    const cell = ensureCell(x, y);
    if (cell) {
      cell.timeSec += dtSec;
    }
  }

  const totalSamples = samples.length;
  const totalTimeSec = [...cells.values()].reduce((sum, c) => sum + c.timeSec, 0);

  const speedBinLabels: string[] = [];
  for (let i = 0; i < speedBinCount; i++) {
    const low = speedOrigin + i * speedStep;
    speedBinLabels.push(formatSpeedBinRangeLabel(low, speedStep));
  }

  const unit = cadenceUnitForSport(sportType);
  const cadenceBinLabels: string[] = [];
  for (let i = 0; i < cadenceBinCount; i++) {
    const low = cadenceOrigin + i * cadenceStep;
    cadenceBinLabels.push(formatCadenceBinRangeLabel(low, cadenceStep, unit));
  }

  const cellMeta = new Map<string, CadenceSpeedHeatmapCellMeta>();
  const data: [number, number, number][] = [];
  let maxCount = 0;

  for (const [key, cell] of cells) {
    const [xStr, yStr] = key.split(',');
    const x = Number(xStr);
    const y = Number(yStr);
    if (!Number.isFinite(x) || !Number.isFinite(y) || cell.count <= 0) {
      continue;
    }
    maxCount = Math.max(maxCount, cell.count);
    data.push([x, y, cell.count]);

    const speedMin = speedOrigin + x * speedStep;
    const cadenceMin = cadenceOrigin + y * cadenceStep;
    cellMeta.set(key, {
      speedMin,
      speedMax: speedMin + speedStep,
      cadenceMin,
      cadenceMax: cadenceMin + cadenceStep,
      count: cell.count,
      timeSec: cell.timeSec,
      percentOfSamples: totalSamples > 0 ? (cell.count / totalSamples) * 100 : 0,
      percentOfTime: totalTimeSec > 0 ? (cell.timeSec / totalTimeSec) * 100 : 0,
    });
  }

  if (data.length === 0) {
    return null;
  }

  return {
    unit,
    zones: defaultCadenceZonesForSport(sportType),
    speedBucketMps: speedStep,
    cadenceBucket: cadenceStep,
    speedBinLabels,
    cadenceBinLabels,
    data,
    cellMeta,
    maxCount,
    totalSamples,
    totalTimeSec,
  };
}
