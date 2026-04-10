import { HeightUnit } from './enums';

export interface HeightPublicShape {
  display: string;
  unit: HeightUnit;
}

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
): HeightPublicShape | null {
  const cm = toCmNumber(heightCmRaw);
  if (cm === null) return null;

  switch (preferredUnit) {
    case HeightUnit.CM: {
      const rounded = Math.round(cm);
      return { display: `${rounded} cm`, unit: preferredUnit };
    }
    case HeightUnit.M: {
      const m = cm / 100;
      const text = m.toFixed(2).replace(/\.?0+$/, '');
      return { display: `${text} m`, unit: preferredUnit };
    }
    case HeightUnit.IN: {
      const { ft, inches } = cmToFeetInches(cm);
      return {
        display: `${ft} ft ${inches} in`,
        unit: preferredUnit,
      };
    }
  }
}
