import type { UserHeightPublicDto } from '../dto/user-public-response.dto';
import { HeightUnit } from '../enums';

function toCmNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function cmToFeetInches(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  let ft = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - ft * 12);
  if (inches === 12) {
    ft += 1;
    inches = 0;
  }
  if (inches < 0) {
    inches = 0;
  }
  return { ft, inches };
}

export function buildHeightForPublic(
  heightCmRaw: unknown,
  preferredUnit: HeightUnit,
): UserHeightPublicDto | null {
  const cm = toCmNumber(heightCmRaw);
  if (cm === null) return null;

  switch (preferredUnit) {
    case HeightUnit.CM: {
      return { unit: HeightUnit.CM, value: Math.round(cm) };
    }
    case HeightUnit.M: {
      return { unit: HeightUnit.M, value: cm / 100 };
    }
    case HeightUnit.IN: {
      const { ft, inches } = cmToFeetInches(cm);
      return { unit: HeightUnit.IN, feet: ft, inches };
    }
  }
}
