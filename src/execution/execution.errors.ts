// Specific errors describing failure scenarios for `Execution`-related operations.
// Used by the owning module to communicate stable and machine-readable failures.

export const executionErrors = {
  invalidMaxAttempts: () => new RangeError('invalidMaxAttempts'),
  invalidRetryDelay: () => new RangeError('invalidRetryDelay'),
  invalidTimeout: () => new RangeError('invalidTimeout'),
  executionTimedOut: () => new DOMException('executionTimedOut', 'TimeoutError'),
};

// ↓ Inferred literal union of error codes from `executionErrors`.
export type ExecutionErrorCode = keyof typeof executionErrors;
