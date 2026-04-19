import { SpeedUnit } from 'src/users/enums/speed-unit.enum';
import { roundToDecimals, toNumber } from './coerce-number';

const SPEED_DISPLAY_DECIMALS = 2;

export interface SpeedPublicValue {
  value: number;
  unit: SpeedUnit;
}

const METERS_TO_KMH = 3.6;
const METERS_TO_MPH = 2.2369362920544;

/** Stored speeds are m/s; `null` / missing → no public value (not zero). */
export function buildSpeedForPublic(
  speedMetersPerSecondRaw: unknown,
  preferredUnit: SpeedUnit,
): SpeedPublicValue | null {
  const mps = toNumber(speedMetersPerSecondRaw);
  if (mps === null) return null;

  let value: number;
  switch (preferredUnit) {
    case SpeedUnit.KMH:
      value = mps * METERS_TO_KMH;
      break;
    case SpeedUnit.MPH:
      value = mps * METERS_TO_MPH;
      break;
    default:
      value = mps;
      break;
  }
  return { value: roundToDecimals(value, SPEED_DISPLAY_DECIMALS), unit: preferredUnit };
}
