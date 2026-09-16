import { z } from 'zod';

import type { StringifiedPayload } from './zod-validation.types';
import { isPlainObject } from './zod-validation.utilities';

export const parseQueryValue = (value: unknown): unknown => {
  // Converts only unambiguous primitive query values before Zod validation, so regular
  // z.number() and z.boolean() schemas can correctly parse string-based query input.

  if (Array.isArray(value)) return value.map(parseQueryValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, parseQueryValue(entryValue)]));
  }

  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();

  if (normalized === '') return value;
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return Number(normalized);

  return value;
};

/**
 * Preprocesses query-like values before Zod validation.
 *
 * Query parameters are string-based by nature, even when they semantically represent
 * numbers or booleans. This helper converts only clear primitive values, allowing
 * regular schemas like `z.number()` and `z.boolean()` to validate query input directly.
 *
 * @example
 * const schema = asQuery(z.object({
 *   page: z.number().int().positive(),
 *   isActive: z.boolean(),
 * }));
 *
 * schema.parse({ page: '2', isActive: 'true' });
 * // { page: 2, isActive: true }
 */
export const asQuery = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(parseQueryValue, schema);

/**
 * Recursively converts payload values to strings without changing container structure.
 * Objects and arrays are copied while `null` and `undefined` retain omission semantics.
 *
 * @example
 * stringifyPayloadValues({ page: 2, enabled: true });
 * // { page: '2', enabled: 'true' }
 */
export function stringifyPayloadValues<TValue>(value: TValue): StringifiedPayload<TValue> {
  if (Array.isArray(value)) {
    return value.map(stringifyPayloadValues) as StringifiedPayload<TValue>;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value).map(([key, entryValue]) => {
      return [key, stringifyPayloadValues(entryValue)];
    });

    // TypeScript cannot connect recursive mapped types with runtime plain-object detection;
    // Every reconstructed property follows `StringifiedPayload`, preserving that contract;

    return Object.fromEntries(entries) as StringifiedPayload<TValue>;
  }

  // Nullish values remain distinct so transport adapters can omit or encode them explicitly.
  const isNullishValue = value === null || value === undefined;
  if (isNullishValue) return value as StringifiedPayload<TValue>;

  return String(value) as StringifiedPayload<TValue>;
}
