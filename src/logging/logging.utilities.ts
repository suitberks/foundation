import { isString } from '@/guard';

/**
 * Extracts useful trace context from an unknown failure without inventing a message.
 * Strings pass through directly, while native errors prefer their complete stack.
 */
export function normalizeLogError(error: unknown): string | undefined {
  if (isString(error)) {
    return error;
  }

  if (error instanceof Error === false) {
    return undefined;
  }

  return error.stack ?? error.message;
}
