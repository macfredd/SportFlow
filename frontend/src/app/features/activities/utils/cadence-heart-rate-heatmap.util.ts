import type { SportType, TrackPointChartPublicDto } from '@shared/models/activity.model';
import { isMissingHeartRate } from '@features/activities/utils/activity-display.util';
import {
  CADENCE_HEART_RATE_HEATMAP_HR_BUCKET,
  CADENCE_MAX_SEGMENT_DT_SEC,
  CADENCE_SPEED_HEATMAP_CADENCE_BUCKET,
} from './cadence-metrics.constants';
import type { CadenceUnit } from './cadence-metrics.util';
import { formatCadenceBinRangeLabel } from './cadence-speed-heatmap.util';

export interface CadenceHeartRateHeatmapCellMeta {
  readonly cadenceMin: number;
  readonly cadenceMax: number;
  readonly hrMin: number;
  readonly hrMax: number;
  readonly count: number;
  readonly timeSec: number;
  readonly percentOfSamples: number;
  readonly percentOfTime: number;
}

export interface CadenceHeartRateHeatmapViewModel {
  readonly unit: CadenceUnit;
  readonly cadenceBucket: number;
  readonly hrBucket: number;
  readonly cadenceBinLabels: readonly string[];
  readonly hrBinLabels: readonly string[];
  /** [cadenceBinIndex, hrBinIndex, sampleCount]. */
  readonly data: readonly [number, number, number][];
  readonly cellMeta: ReadonlyMap<string, CadenceHeartRateHeatmapCellMeta>;
  /** Time-weighted mean HR per cadence column (inflection curve). */
  readonly avgHrByCadenceBin: readonly (number | null)[];
  readonly maxCount: number;
  readonly totalSamples: number;
  readonly totalTimeSec: number;
  readonly hrLineMin: number;
  readonly hrLineMax: number;
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

function segmentMean(a: number | null, b: number | null): number | null {
  const vals = [a, b].filter((v): v is number => v != null && Number.isFinite(v));
  if (vals.length === 0) {
    return null;
  }
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export function formatHeartRateBinRangeLabel(low: number, step: number): string {
  const high = low + step;
  return `${low}–${high} bpm`;
}

/**
 * Cadence (X) × heart rate (Y) sample density — cardiovascular cost at each cadence.
 */
export function buildCadenceHeartRateHeatmapViewModel(
  chart: TrackPointChartPublicDto | null,
  sportType: SportType | undefined,
  options?: {
    readonly cadenceBucket?: number;
    readonly hrBucket?: number;
  },
): CadenceHeartRateHeatmapViewModel | null {
  const points = chart?.track_points ?? [];
  if (points.length === 0 || !sportType) {
    return null;
  }

  const cadenceStep = options?.cadenceBucket ?? CADENCE_SPEED_HEATMAP_CADENCE_BUCKET;
  const hrStep = options?.hrBucket ?? CADENCE_HEART_RATE_HEATMAP_HR_BUCKET;

  const samples: { cadence: number; hr: number }[] = [];
  let minCadence = Infinity;
  let maxCadence = -Infinity;
  let minHr = Infinity;
  let maxHr = -Infinity;

  for (const point of points) {
    const cadence = point.cadence;
    const hr = point.heart_rate;
    if (!isValidCadence(cadence) || !isValidHeartRate(hr)) {
      continue;
    }
    samples.push({ cadence, hr });
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

  const cadenceOrigin = bucketLower(minCadence, cadenceStep);
  const cadenceEnd = bucketLower(maxCadence, cadenceStep) + cadenceStep;
  const hrOrigin = bucketLower(minHr, hrStep);
  const hrEnd = bucketLower(maxHr, hrStep) + hrStep;

  const cadenceBinCount = Math.max(1, Math.round((cadenceEnd - cadenceOrigin) / cadenceStep));
  const hrBinCount = Math.max(1, Math.round((hrEnd - hrOrigin) / hrStep));

  const cells = new Map<string, MutableCell>();
  const cadenceHrWeighted = Array.from({ length: cadenceBinCount }, () => ({
    sumHrSec: 0,
    sec: 0,
  }));

  const ensureCell = (x: number, y: number): MutableCell | null => {
    if (x < 0 || x >= cadenceBinCount || y < 0 || y >= hrBinCount) {
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
    const x = bucketIndex(sample.cadence, cadenceOrigin, cadenceStep);
    const y = bucketIndex(sample.hr, hrOrigin, hrStep);
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
    const hr = segmentMean(prev.heart_rate, curr.heart_rate);
    if (
      cadence === null ||
      hr === null ||
      !isValidCadence(cadence) ||
      !isValidHeartRate(hr)
    ) {
      continue;
    }
    const x = bucketIndex(cadence, cadenceOrigin, cadenceStep);
    const y = bucketIndex(hr, hrOrigin, hrStep);
    const cell = ensureCell(x, y);
    if (cell) {
      cell.timeSec += dtSec;
    }
    if (x >= 0 && x < cadenceBinCount) {
      cadenceHrWeighted[x].sumHrSec += hr * dtSec;
      cadenceHrWeighted[x].sec += dtSec;
    }
  }

  const totalSamples = samples.length;
  const totalTimeSec = [...cells.values()].reduce((sum, c) => sum + c.timeSec, 0);
  const unit = cadenceUnitForSport(sportType);

  const cadenceBinLabels: string[] = [];
  for (let i = 0; i < cadenceBinCount; i++) {
    const low = cadenceOrigin + i * cadenceStep;
    cadenceBinLabels.push(formatCadenceBinRangeLabel(low, cadenceStep, unit));
  }

  const hrBinLabels: string[] = [];
  for (let i = 0; i < hrBinCount; i++) {
    const low = hrOrigin + i * hrStep;
    hrBinLabels.push(formatHeartRateBinRangeLabel(low, hrStep));
  }

  const avgHrByCadenceBin = cadenceHrWeighted.map((w) =>
    w.sec > 0 ? Math.round(w.sumHrSec / w.sec) : null,
  );

  const hrLineValues = avgHrByCadenceBin.filter((v): v is number => v != null);
  const hrLineMin = hrLineValues.length > 0 ? Math.min(...hrLineValues) : minHr;
  const hrLineMax = hrLineValues.length > 0 ? Math.max(...hrLineValues) : maxHr;
  const hrLinePad = Math.max(4, Math.round((hrLineMax - hrLineMin) * 0.08));

  const cellMeta = new Map<string, CadenceHeartRateHeatmapCellMeta>();
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

    const cadenceMin = cadenceOrigin + x * cadenceStep;
    const hrMin = hrOrigin + y * hrStep;
    cellMeta.set(key, {
      cadenceMin,
      cadenceMax: cadenceMin + cadenceStep,
      hrMin,
      hrMax: hrMin + hrStep,
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
    cadenceBucket: cadenceStep,
    hrBucket: hrStep,
    cadenceBinLabels,
    hrBinLabels,
    data,
    cellMeta,
    avgHrByCadenceBin,
    maxCount,
    totalSamples,
    totalTimeSec,
    hrLineMin: Math.max(0, hrLineMin - hrLinePad),
    hrLineMax: hrLineMax + hrLinePad,
  };
}
