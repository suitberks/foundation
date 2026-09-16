import { REDACTED_LOG_VALUE, sensitiveLogKeyParts } from './logging.constants';

// ↓ Redaction results carry the transformed structure and whether any value changed;
// The marker avoids needless serialization when a parsed JSON payload stays untouched;

type SensitiveValueRedactionResult = { value: unknown; redacted: boolean };

/**
 * Checks whether a logging field name contains a configured sensitive fragment.
 * Matching ignores casing and separators to cover compound naming conventions.
 */
function isSensitiveLogKey(key: string): boolean {
  const normalizedKey = key.toLowerCase().replaceAll(/[^a-z]/g, '');
  const isSensitive = sensitiveLogKeyParts.some((sensitivePart) => normalizedKey.includes(sensitivePart));

  return isSensitive;
}

/**
 * Recursively replaces values owned by sensitive object keys with the public marker.
 * The result reports whether any replacement occurred to avoid needless serialization.
 */
function redactSensitiveValueResult(
  value: unknown,
  seenValues: WeakMap<object, unknown> = new WeakMap()
): SensitiveValueRedactionResult {
  if (Array.isArray(value)) {
    const existingValue = seenValues.get(value);
    if (existingValue) return { value: existingValue, redacted: false };

    const redactedValue: unknown[] = [];
    seenValues.set(value, redactedValue);

    const entries = value.map((entry) => redactSensitiveValueResult(entry, seenValues));
    redactedValue.push(...entries.map((entry) => entry.value));

    return {
      value: redactedValue,
      redacted: entries.some((entry) => entry.redacted),
    };
  }

  // Primitives cannot own sensitive keys; the explicit null check avoids JavaScript's object classification.
  const isPrimitiveValue = typeof value !== 'object' || value === null;
  if (isPrimitiveValue) return { value, redacted: false };

  // ↓ Preserve objects whose internal state cannot be reconstructed from enumerable keys.

  const prototype: object | null = Object.getPrototypeOf(value);
  const isCustomObject = prototype !== Object.prototype && prototype !== null;
  if (isCustomObject) return { value, redacted: false };

  const existingValue = seenValues.get(value);
  if (existingValue) return { value: existingValue, redacted: false };

  let redacted = false;
  const redactedValue = Object.create(prototype) as Record<string, unknown>;
  seenValues.set(value, redactedValue);

  // ↓ Copy enumerable entries individually so circular references resolve to the cloned structure.

  for (const [key, entryValue] of Object.entries(value)) {
    // ↓ Replace complete sensitive values without exposing or traversing nested content.

    if (isSensitiveLogKey(key)) {
      redacted = true;
      redactedValue[key] = REDACTED_LOG_VALUE;
      continue;
    }

    const nestedEntry = redactSensitiveValueResult(entryValue, seenValues);

    // ↓ Carry nested replacements upward while preserving every safe value.

    redacted ||= nestedEntry.redacted;
    redactedValue[key] = nestedEntry.value;
  }

  return { value: redactedValue, redacted };
}

/**
 * Recursively replaces values owned by sensitive keys in an arbitrary structure.
 * Arrays and safe values retain their original ordering and primitive identity.
 */
export function redactSensitiveValue(value: unknown): unknown {
  return redactSensitiveValueResult(value).value;
}

/**
 * Replaces sensitive query values using partial, case-insensitive key matching.
 * A new collection is returned so the caller's search parameters remain unchanged.
 */
export function redactSensitiveSearchParams(searchParams: URLSearchParams): URLSearchParams {
  const redactedSearchParams = new URLSearchParams();

  // ↓ Rebuild entries individually so repeated keys and their original ordering remain intact.

  for (const [key, value] of searchParams) {
    redactedSearchParams.append(key, isSensitiveLogKey(key) ? REDACTED_LOG_VALUE : value);
  }

  return redactedSearchParams;
}

/**
 * Replaces values under sensitive keys throughout a serialized JSON structure.
 * Invalid JSON and payloads without matching keys are returned byte-for-byte unchanged.
 */
export function redactSensitiveJSON(json: string): string {
  try {
    // ↓ Parse structure before redaction so key boundaries cannot be confused with string content.

    const parsedValue = JSON.parse(json) as unknown;
    const result = redactSensitiveValueResult(parsedValue);

    return result.redacted ? JSON.stringify(result.value) : json;
  } catch {
    return json;
  }
}
