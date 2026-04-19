import { DistanceUnit } from '../../../users/enums';
import { roundToDecimals, toNumber } from './coerce-number';

const DISTANCE_DISPLAY_DECIMALS = 2;

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
      return {
        value: roundToDecimals(km, DISTANCE_DISPLAY_DECIMALS),
        unit: preferredUnit,
      };
    }
    case DistanceUnit.MI: {
      const mi = meters * METERS_TO_MILES;
      return {
        value: roundToDecimals(mi, DISTANCE_DISPLAY_DECIMALS),
        unit: preferredUnit,
      };
    }
  }
}
