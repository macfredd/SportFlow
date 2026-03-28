/** Canonical stored unit elsewhere: meters per second. */

export function metersPerSecondToKmh(mps: number): number {
  return Math.round(mps * 3.6 * 100) / 100;
}

export function metersPerSecondToMph(mps: number): number {
  return Math.round(mps * 2.2369362920544 * 100) / 100;
}

/**
 * Seconds required to cover 1 km at constant `mps`. For pace mm:ss/km formatting in UI.
 */
export function secondsPerKmFromMetersPerSecond(
  mps: number,
): number | null {
  if (!Number.isFinite(mps) || mps <= 0) return null;
  return 1000 / mps;
}
