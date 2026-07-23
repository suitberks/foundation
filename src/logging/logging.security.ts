import { REDACTED_LOG_VALUE, sensitiveLogKeyParts } from './logging.constants';

/**
 * Checks whether a logging field name contains a configured sensitive fragment.
 * Matching ignores casing and separators to cover compound naming conventions.
 */
function isSensitiveLogKey(key: string): boolean {
  const normalizedKey = key.toLowerCase().replaceAll(/[^a-z]/g, '');
  return sensitiveLogKeyParts.some((sensitivePart) => normalizedKey.includes(sensitivePart));
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

  // Primitives cannot own sensitive keys and therefore pass through without allocation;
  // The null check is explicit because JavaScript otherwise classifies `null` as an object;

  if (typeof value !== 'object' || value === null) return { value, redacted: false };

  let redacted = false;

  const entries = Object.entries(value).map(([key, entryValue]) => {
    // A sensitive parent key replaces its complete value without inspecting nested content;
    // This prevents objects, arrays, and primitive secrets from following different paths;

    if (isSensitiveLogKey(key)) {
      redacted = true;
      return [key, REDACTED_LOG_VALUE] as const;
    }

    const nestedEntry = redactSensitiveValue(entryValue);

    // The accumulated flag records changes from every preceding and current object property;
    // Reconstructed entries preserve safe values while carrying nested replacements upward;

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
  const redactedSearchParams = new URLSearchParams(searchParams);

  // Replacing by key covers repeated values while preserving all safe entries and ordering;
  // The encoded output remains valid for direct inclusion in the request log suffix;

  for (const key of new Set(redactedSearchParams.keys())) {
    if (isSensitiveLogKey(key)) redactedSearchParams.set(key, REDACTED_LOG_VALUE);
  }

  return redactedSearchParams;
}

/**
 * Replaces values under sensitive keys throughout a serialized JSON structure.
 * Invalid JSON and payloads without matching keys are returned byte-for-byte unchanged.
 */
export function redactSensitiveJSON(json: string): string {
  if (json === undefined || null) return json;

  try {
    // JSON parsing exposes nested key structure that string replacement cannot distinguish safely;
    // Serialization occurs only after redaction so unaffected payload formatting stays untouched;

    const parsedValue = JSON.parse(json) as unknown;
    const result = redactSensitiveValue(parsedValue);

    return result.redacted ? JSON.stringify(result.value) : json;
  } catch {
    return json;
  }
}
