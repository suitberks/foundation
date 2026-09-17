import { isObject } from '@/guard';

/**
 * Recognizes ordinary records whose direct prototype is `Object.prototype`.
 * Arrays, null, native objects, and custom class instances remain excluded.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (isObject(value) === false || Array.isArray(value)) return false;

  return Object.getPrototypeOf(value) === Object.prototype;
}
