/**
 * Checks whether a value is a plain record backed by `Object.prototype`.
 * Arrays, null, dates, collections, and custom class instances are rejected.
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
};
