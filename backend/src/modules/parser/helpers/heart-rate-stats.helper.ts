import { ParsedTrackPoint } from '../dto/parsed-track-point.dto';

export interface HeartRateAggregate {
  avgHeartRate: number | null;
  maxHeartRate: number | null;
}

/** Avg (rounded) and max over samples with non-null `heartRate`. Shared by GPX (and optionally FIT validation). */
export function aggregateHeartRateFromTrackPoints(
  points: ParsedTrackPoint[],
): HeartRateAggregate {
  const samples: number[] = [];
  for (const p of points) {
    if (p.heartRate != null) samples.push(p.heartRate);
  }
  if (samples.length === 0) {
    return { avgHeartRate: null, maxHeartRate: null };
  }
  const sum = samples.reduce((a, b) => a + b, 0);
  return {
    avgHeartRate: Math.round(sum / samples.length),
    maxHeartRate: Math.max(...samples),
  };
}
