import { ParsedTrackPoint } from '../dto/parsed-track-point.dto';

export interface ElevationAggregate {
  elevationGainMeters: number | null;
  elevationLossMeters: number | null;
}

const DEFAULT_NOISE_THRESHOLD_M = 3;

function roundMeters2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculates elevation gain and loss using accumulated deltas.
 * Instead of filtering per-point noise, it accumulates small changes
 * until they exceed a threshold, which better captures gradual climbs/descents.
 */
export function aggregateElevationFromTrackPoints(
  points: ParsedTrackPoint[],
  options?: { noiseThresholdMeters?: number },
): ElevationAggregate {
  const threshold = options?.noiseThresholdMeters ?? DEFAULT_NOISE_THRESHOLD_M;

  let gain = 0;
  let loss = 0;

  let acc = 0;
  let pairedSegments = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const a0 = points[i].altitude;
    const a1 = points[i + 1].altitude;

    if (a0 == null || a1 == null) continue;

    pairedSegments++;

    const delta = a1 - a0;

    acc += delta;

    if (acc >= threshold) {
      gain += acc;
      acc = 0;
    } else if (acc <= -threshold) {
      loss += -acc;
      acc = 0;
    }
  }

  if (pairedSegments === 0) {
    return { elevationGainMeters: null, elevationLossMeters: null };
  }

  return {
    elevationGainMeters: roundMeters2(gain),
    elevationLossMeters: roundMeters2(loss),
  };
}