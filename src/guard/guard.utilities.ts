/**
 * Narrows a value to JavaScript `null` or `undefined` without excluding other falsy values.
 * The predicate keeps zero, empty strings, and `false` outside the resulting nullish branch.
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Excludes JavaScript `null` and `undefined` while preserving every other supplied value.
 * Generic narrowing retains the caller's concrete non-nullish union members and literals.
 */
export function isNotNil<TValue>(value: TValue): value is NonNullable<TValue> {
  return value !== null && value !== undefined;
}

/**
 * Narrows a value to a primitive JavaScript boolean without coercing truthy or falsy values.
 * Boxed `Boolean` objects and numeric boolean representations remain outside the result.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Narrows a value to a primitive JavaScript number without imposing numeric validity policy.
 * `NaN` and infinite numbers remain included because their runtime type is still `number`.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Narrows a value to one unsigned byte accepted by browser and server binary protocols.
 * Fractional, negative, infinite, and values above `0xff` remain outside the result.
 */
export function isByte(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= 0 && value <= 0xff;
}

/**
 * Narrows a value to a primitive JavaScript string without performing value normalization.
 * Empty strings remain included while boxed `String` objects stay outside the result.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Narrows a value to the non-null object category reported by JavaScript `typeof`.
 * Arrays and native instances remain included while functions and primitives are excluded.
 */
export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

/**
 * Narrows a value to the callable or constructable category reported by JavaScript `typeof`.
 * Ordinary functions, async functions, generators, and class constructors remain included.
 */
export function isFunction(value: unknown): value is CallableFunction | NewableFunction {
  return typeof value === 'function';
}
