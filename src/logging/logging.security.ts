import { isObject } from '@/guard';

import { REDACTED_LOG_VALUE, SENSITIVE_LOG_KEY_PARTS } from './logging.constants';

/**
 * Checks whether a logging field name contains a configured sensitive fragment.
 * Matching ignores casing and separators to cover compound naming conventions.
 */
function isSensitiveLogKey(key: string): boolean {
  const normalizedKey = key.toLowerCase().replaceAll(/[^a-z]/g, '');
  const isSensitive = SENSITIVE_LOG_KEY_PARTS.some((sensitivePart) => normalizedKey.includes(sensitivePart));

  return isSensitive;
}

/**
 * Checks whether any traversable level of a structure owns a sensitive key.
 * Custom instances and repeated references are skipped exactly as in redaction.
 */
function hasSensitiveLogValue(value: unknown, seenValues: WeakSet<object> = new WeakSet()): boolean {
  // ↓ Primitives and already inspected references cannot add another sensitive key.

  if (isObject(value) === false || seenValues.has(value)) {
    return false;
  }

  seenValues.add(value);

  if (Array.isArray(value)) {
    return value.some((entry) => hasSensitiveLogValue(entry, seenValues));
  }

  // ↓ Skip objects whose internal state cannot be reconstructed from enumerable keys.

  const prototype: object | null = Object.getPrototypeOf(value);
  const isCustomObject = prototype !== Object.prototype && prototype !== null;

  if (isCustomObject) {
    return false;
  }

  return Object.entries(value).some(([key, entryValue]) => {
    return isSensitiveLogKey(key) || hasSensitiveLogValue(entryValue, seenValues);
  });
}

/**
 * Recursively copies a structure while replacing values owned by sensitive keys.
 * Shared and circular references resolve to the same copy inside one invocation.
 */
function copyRedactedLogValue(value: unknown, seenValues: WeakMap<object, unknown>): unknown {
  if (Array.isArray(value)) {
    const existingValue = seenValues.get(value);

    if (existingValue !== undefined) {
      return existingValue;
    }

    const redactedValue: unknown[] = [];
    seenValues.set(value, redactedValue);
    redactedValue.push(...value.map((entry) => copyRedactedLogValue(entry, seenValues)));

    return redactedValue;
  }

  if (isObject(value) === false) {
    return value;
  }

  // ↓ Preserve objects whose internal state cannot be reconstructed from enumerable keys.

  const prototype: object | null = Object.getPrototypeOf(value);
  const isCustomObject = prototype !== Object.prototype && prototype !== null;

  if (isCustomObject) {
    return value;
  }

  const existingValue = seenValues.get(value);

  if (existingValue !== undefined) {
    return existingValue;
  }

  const redactedValue = Object.create(prototype) as Record<string, unknown>;
  seenValues.set(value, redactedValue);

  for (const [key, entryValue] of Object.entries(value)) {
    // Replace complete sensitive values without exposing or traversing nested content.
    redactedValue[key] = isSensitiveLogKey(key) ? REDACTED_LOG_VALUE : copyRedactedLogValue(entryValue, seenValues);
  }

  return redactedValue;
}

/**
 * Recursively replaces values owned by sensitive keys in an arbitrary structure.
 * Arrays and safe values retain their original ordering and primitive identity.
 */
export function redactSensitiveValue(value: unknown): unknown {
  return copyRedactedLogValue(value, new WeakMap());
}

/**
 * Replaces sensitive query values using partial, case-insensitive key matching.
 * A new collection is returned so the caller's search parameters remain unchanged.
 */
export function redactSensitiveSearchParams(searchParams: URLSearchParams): URLSearchParams {
  const redactedSearchParams = new URLSearchParams();

  for (const [key, value] of searchParams) {
    redactedSearchParams.append(key, isSensitiveLogKey(key) ? REDACTED_LOG_VALUE : value);
  }

  return redactedSearchParams;
}

/**
 * Replaces sensitive values inside one `application/x-www-form-urlencoded` body.
 * Bodies without matching keys are returned byte-for-byte unchanged to the caller.
 */
export function redactSensitiveFormBody(body: string): string {
  const searchParams = new URLSearchParams(body);
  const hasSensitiveKey = [...searchParams.keys()].some(isSensitiveLogKey);

  if (hasSensitiveKey === false) {
    return body;
  }

  return redactSensitiveSearchParams(searchParams).toString();
}

/**
 * Replaces values under sensitive keys throughout one serialized JSON structure.
 * Invalid JSON and payloads without matching keys are returned byte-for-byte.
 */
export function redactSensitiveJSON(json: string): string {
  try {
    const parsedValue = JSON.parse(json) as unknown;

    if (hasSensitiveLogValue(parsedValue) === false) {
      return json;
    }

    return JSON.stringify(redactSensitiveValue(parsedValue));
  } catch {
    return json;
  }
}
