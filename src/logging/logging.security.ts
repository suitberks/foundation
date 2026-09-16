import { REDACTED_LOG_VALUE, sensitiveLogKeyParts } from './logging.constants';

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
function redactSensitiveValue(value: unknown): { value: unknown; redacted: boolean } {
  if (Array.isArray(value)) {
    const entries = value.map(redactSensitiveValue);

    return {
      value: entries.map((entry) => entry.value),
      redacted: entries.some((entry) => entry.redacted),
    };
  }

  // Primitives cannot own sensitive keys; the explicit null check avoids JavaScript's object classification.
  if (typeof value !== 'object' || value === null) return { value, redacted: false };

  let redacted = false;

  const entries = Object.entries(value).map(([key, entryValue]) => {
    // Replace complete sensitive values without exposing or traversing nested content.
    if (isSensitiveLogKey(key)) {
      redacted = true;
      return [key, REDACTED_LOG_VALUE] as const;
    }

    const nestedEntry = redactSensitiveValue(entryValue);

    // Carry nested replacements upward while preserving every safe value.
    redacted ||= nestedEntry.redacted;

    return [key, nestedEntry.value] as const;
  });

  return { value: Object.fromEntries(entries), redacted };
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
    const result = redactSensitiveValue(parsedValue);

    return result.redacted ? JSON.stringify(result.value) : json;
  } catch {
    return json;
  }
}
