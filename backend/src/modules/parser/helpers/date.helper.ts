/**
 * Converts a value to a date.
 * @param value - The value to convert.
 * @returns The date. If the value is not a string, date, or undefined, it will return the current date.
 */
export function toDate(value: string | Date | undefined): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return new Date();
}

/**
 * Whole seconds from `start` to `end` (rounded). For invalid dates or if end is before start, returns null.
 */
export function elapsedWholeSecondsBetween(
  start: Date,
  end: Date,
): number | null {
  const t0 = start.getTime();
  const t1 = end.getTime();
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 < t0) {
    return null;
  }
  return Math.round((t1 - t0) / 1000);
}
