import { createStringEnumRecord } from '@/string-enum';

// `HMAC` enums define supported literal collections and synchronized public aliases;
// Derived unions and records preserve one authoritative source for every enum family;

// == DigestAlgorithms ==================================================

export const hmacAlgorithmsArray = ['SHA-256', 'SHA-384', 'SHA-512'] as const;

export type HMACAlgorithm = (typeof hmacAlgorithmsArray)[number];

// ↓ Descriptive and concise aliases share one immutable `HMACAlgorithm` record;

export const hmacAlgorithmsRecord = createStringEnumRecord(hmacAlgorithmsArray);
export const hmacAlgorithm = hmacAlgorithmsRecord;

// == SignatureEncodings ================================================

export const hmacEncodingsArray = ['hex', 'base64', 'base64url'] as const;

export type HMACEncoding = (typeof hmacEncodingsArray)[number];

// ↓ Descriptive and concise aliases share one immutable `HMACEncoding` record;

export const hmacEncodingsRecord = createStringEnumRecord(hmacEncodingsArray);
export const hmacEncoding = hmacEncodingsRecord;
