/** Coerce DB decimal / string to number. */
export function toNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Stable rounding for API display values (avoids `4.235600000000001`-style noise). */
export function roundToDecimals(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
