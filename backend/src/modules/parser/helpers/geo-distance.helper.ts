import { ParsedTrackPoint } from '../dto/parsed-track-point.dto';

/** Mean Earth radius (meters), sufficient for path lengths on activity tracks. */
const EARTH_RADIUS_M = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two WGS84-like lat/lon points (degrees).
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const a =
    s1 * s1 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return EARTH_RADIUS_M * c;
}

function roundMeters2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Sums horizontal distance along consecutive points that have both latitude and longitude. */
export function aggregatePathDistanceMeters(
  points: ParsedTrackPoint[],
): number | null {
  let total = 0;
  let segments = 0;

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

    total += haversineDistanceMeters(
      p0.latitude,
      p0.longitude,
      p1.latitude,
      p1.longitude,
    );
    segments++;
  }

  if (segments === 0) return null;
  return roundMeters2(total);
}
