/**
 * Checks if the given value is a plain object (i.e., an object
 * that is not null, not an array, and has a prototype of Object).
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};
