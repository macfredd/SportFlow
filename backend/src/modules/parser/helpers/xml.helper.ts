/**
 * Converts a value to an array if it is not already an array.
 * @param value - The value to convert. If it is not an array, it will be converted to an array with the value as the first element. If value is null or undefined, it will return an empty array.
 * @returns An array with the value as the first element if it is not already an array.
 */
export const asArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (value == null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

/**
 * Converts a value to a string.
 * @param value - The value to convert.
 * @returns The text content of the value. If the value is not a string, number, boolean, or object with a 'value' property, it will return undefined.
 */
export function xmlTextContent(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object' && 'value' in (value as object)) {
    const inner = (value as { value: unknown }).value;
    if (inner == null) return undefined;
    return String(inner);
  }
  return undefined;
}