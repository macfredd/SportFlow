import { DistanceUnit } from '../../../users/enums';
import { toNumber } from './coerce-number';

/** Numeric value in `unit` (km or mi); labels are localized on the client. */
export interface DistancePublicValue {
  value: number;
  unit: DistanceUnit;
}

const METERS_TO_MILES = 0.000621371192;
const METERS_TO_KM = 0.001;
/**
 * Distance from stored meters, using the user's preferred unit (same idea as height).
 */
export function buildDistanceForPublic(
  distanceMetersRaw: unknown,
  preferredUnit: DistanceUnit,
): DistancePublicValue | null {
  const meters = toNumber(distanceMetersRaw);
  if (meters === null) return null;

  switch (preferredUnit) {
    case DistanceUnit.KM: {
      const km = meters * METERS_TO_KM;
      return { value: km, unit: preferredUnit };
    }
    case DistanceUnit.MI: {
      const mi = meters * METERS_TO_MILES;
 
      return { value: mi, unit: preferredUnit };
    }
  }
}
