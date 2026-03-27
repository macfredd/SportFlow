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
 * Sums elevation gain and loss from consecutive points where both have `altitude`.
 * Ignores vertical change below `noiseThresholdMeters` (GPS / barometer noise).
 * Gain/loss are positive magnitudes (loss = total descent).
 */
export function aggregateElevationFromTrackPoints(
  points: ParsedTrackPoint[],
  options?: { noiseThresholdMeters?: number },
): ElevationAggregate {
  const threshold = options?.noiseThresholdMeters ?? DEFAULT_NOISE_THRESHOLD_M;
  let gain = 0;
  let loss = 0;
  let pairedSegments = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const a0 = points[i].altitude;
    const a1 = points[i + 1].altitude;
    if (a0 == null || a1 == null) continue;

    pairedSegments++;
    const delta = a1 - a0;

    if (delta > threshold) {
      gain += delta;
    } else if (delta < -threshold) {
      loss += -delta;
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
