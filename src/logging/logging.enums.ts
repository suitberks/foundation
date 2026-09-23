import { createStringEnumRecord } from '@/string-enum';

// `Logging` enums define supported literal collections and synchronized public aliases.
// Derived unions and records preserve one authoritative source for every enum family.

export const logLevelsArray = ['info', 'warn', 'error'] as const;

// ↓ Descriptive and concise aliases share one immutable `LogLevel` record.

export const logLevelsRecord = createStringEnumRecord(logLevelsArray);
export const logLevel = logLevelsRecord;

// ↓ Inferred literal union of values from `logLevelsArray`.
export type LogLevel = (typeof logLevelsArray)[number];
