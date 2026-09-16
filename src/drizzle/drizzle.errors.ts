// Specific errors describing failure scenarios for `Drizzle`-related operations;
// Used by the owning module to communicate stable and machine-readable failures;

export const drizzleErrors = {
  whereConditionsRequired: () => new Error('whereConditionsRequired'),
  whereColumnNotFound: () => new Error('whereColumnNotFound'),
};

// ↓ Inferred literal union of error codes from `drizzleErrors`;
export type DrizzleErrorCode = keyof typeof drizzleErrors;
