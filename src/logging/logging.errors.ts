// Specific errors describing failure scenarios for `Logging`-related operations.
// Used by the owning module to communicate stable and machine-readable failures.

export const loggingErrors = {
  invalidBodyPreviewEdgeLength: () => new RangeError('invalidBodyPreviewEdgeLength'),
};

// ↓ Inferred literal union of error codes from `loggingErrors`.
export type LoggingErrorCode = keyof typeof loggingErrors;
