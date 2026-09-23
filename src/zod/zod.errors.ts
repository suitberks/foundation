// Specific errors describing failure scenarios for `Zod`-related operations.
// Used by the owning module to communicate stable and machine-readable failures.

export const zodErrors = {
  atLeastOneRequired: () => ({ code: 'custom' as const, message: 'atLeastOneRequired' }),
};

// ↓ Inferred literal union of error codes from `zodErrors`.
export type ZodErrorCode = keyof typeof zodErrors;
