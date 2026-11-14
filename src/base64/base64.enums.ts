import { createStringEnumRecord } from '@/string-enum';

// `Base64` enums define supported literal collections and synchronized public aliases.
// Derived unions and records preserve one authoritative source for every enum family.

export const base64AlphabetsArray = ['base64', 'base64url'] as const;

// ↓ Descriptive and concise aliases share one immutable `Base64Alphabet` record.

export const base64AlphabetsRecord = createStringEnumRecord(base64AlphabetsArray);
export const base64Alphabet = base64AlphabetsRecord;

// Inferred literal union of values from `base64AlphabetsArray`.
export type Base64Alphabet = (typeof base64AlphabetsArray)[number];
