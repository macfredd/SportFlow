import type {
  SportType,
  TrackPointChartDetailPublicDto,
  TrackPointChartPublicDto,
} from '../../../shared/models/activity.model';
import {
  CADENCE_MAX_SEGMENT_DT_SEC,
  minSpeedMpsForSport,
} from './cadence-metrics.constants';

export type CadenceUnit = 'spm' | 'rpm';

export interface CadenceMetricsViewModel {
  readonly avgCadence: number | null;
  readonly maxCadence: number | null;
  readonly minCadenceMoving: number | null;
  readonly movingCadence: number | null;
  readonly unit: CadenceUnit;
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
