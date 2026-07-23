import { createStringEnumRecord } from '@/utilities/enums.utilities';

// `Logging` levels share one literal source across service methods and color configuration;
// The derived union and records keep runtime values synchronized with public type contracts;

export const logLevelsArray = ['info', 'warn', 'error'] as const;

export type LogLevel = (typeof logLevelsArray)[number];

// Concise alias supports `logLevel.INFO`, `logLevel.WARN`, and `logLevel.ERROR` access;
// Both exports preserve the same immutable record derived from `logLevelsArray`;

export const logLevelsRecord = createStringEnumRecord(logLevelsArray);
export const logLevel = logLevelsRecord;
