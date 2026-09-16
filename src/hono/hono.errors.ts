import { HTTPException } from 'hono/http-exception';

// Specific errors describing failure scenarios for `Hono`-related operations;
// Used by the owning module to communicate stable and machine-readable failures;

export const honoErrors = {
  internalServerError: () => new HTTPException(500, { message: 'internalServerError' }),
};

// ↓ Inferred literal union of error codes from `honoErrors`;
export type HonoErrorCode = keyof typeof honoErrors;
