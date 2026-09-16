import { createStringEnumRecord } from '@/utilities/enums.utilities';

// HMAC literal catalogs define the supported digest algorithms and signature encodings;
// Derived unions and records retain one authoritative source for every public alias;

// == DigestAlgorithms ==================================================

export const hmacAlgorithmsArray = ['SHA-256', 'SHA-384', 'SHA-512'] as const;

export type HMACAlgorithm = (typeof hmacAlgorithmsArray)[number];

// ↓ Expose descriptive and concise aliases from one immutable algorithm record;

export const hmacAlgorithmsRecord = createStringEnumRecord(hmacAlgorithmsArray);
export const hmacAlgorithm = hmacAlgorithmsRecord;

// == SignatureEncodings ================================================

export const hmacEncodingsArray = ['hex', 'base64', 'base64url'] as const;

export type HMACEncoding = (typeof hmacEncodingsArray)[number];

// ↓ Expose descriptive and concise aliases from one immutable encoding record;

export const hmacEncodingsRecord = createStringEnumRecord(hmacEncodingsArray);
export const hmacEncoding = hmacEncodingsRecord;
