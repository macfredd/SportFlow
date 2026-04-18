import { DistanceUnit } from '../../../users/enums';
import { toNumber } from './coerce-number';

export interface DistancePublicShape {
  display: string;
  unit: DistanceUnit;
}

/**
 * Distance from stored meters, using the user's preferred unit (same idea as height).
 */
export function buildDistanceForPublic(
  distanceMetersRaw: unknown,
  preferredUnit: DistanceUnit,
): DistancePublicShape | null {
  const meters = toNumber(distanceMetersRaw);
  if (meters === null) return null;

  switch (preferredUnit) {
    case DistanceUnit.KM: {
      const km = meters / 1000;
      return { display: `${km.toFixed(2)} km`, unit: preferredUnit };
    }
    case DistanceUnit.MI: {
      const mi = meters * 0.000621371192;
      return { display: `${mi.toFixed(2)} mi`, unit: preferredUnit };
    }
  }
}
