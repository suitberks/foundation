import { createStringEnumRecord } from '@/utilities/enums.utilities';

// `Response` enums define supported literal collections and synchronized public aliases;
// Derived unions and records preserve one authoritative source for every enum family;
// Reference chart for conventional HTTP status meanings: 2to.uk/http-status-codes;

// == ResponseKinds =====================================================

export const responseKindsArray = ['success', 'error'] as const;

export type ResponseKind = (typeof responseKindsArray)[number];

// ↓ Descriptive and concise aliases share one immutable `ResponseKind` record;

export const responseKindsRecord = createStringEnumRecord(responseKindsArray);
export const responseKind = responseKindsRecord;

// == SuccessStatuses ===================================================

export const SUCCESS_RESPONSE_STATUSES = [200, 201, 202, 206] as const;

export type SuccessResponseStatus = (typeof SUCCESS_RESPONSE_STATUSES)[number];

// == ErrorStatuses =====================================================

export const ERROR_RESPONSE_STATUSES = [
  400, 401, 403, 404, 405, 406, 408, 409, 410, 413, 414, 415, 422, 425, 429, 440, 498, 500, 501, 502, 503, 504,
] as const;

export type ErrorResponseStatus = (typeof ERROR_RESPONSE_STATUSES)[number];
