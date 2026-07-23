import { blue, green, red, yellow } from 'kleur/colors';

import type { LogLevel } from './logging.enums';
import { logLevel } from './logging.enums';

/**
 * Terminal color configuration for every supported logging level.
 * The `LogLevel` contract prevents missing or unsupported level entries.
 */
export const logLevelColors = {
  [logLevel.INFO]: blue,
  [logLevel.WARN]: yellow,
  [logLevel.ERROR]: red,
} as const satisfies Record<LogLevel, (text: string) => string>;

/**
 * Public placeholder written instead of sensitive query and JSON values.
 * One stable marker keeps redacted output recognizable across log consumers.
 */
export const REDACTED_LOG_VALUE = '[redacted]';

/**
 * Normalized key fragments treated as sensitive by logging redaction.
 * Matching ignores case and separators so compound field names remain covered.
 */
export const sensitiveLogKeyParts = [
  'password',
  'passwd',
  'token',
  'secret',
  'authorization',
  'apikey',
  'credential',
] as const;

/**
 * Terminal colors assigned to the supported HTTP response status ranges.
 * Unlisted ranges intentionally retain the terminal's default text appearance.
 */
export const httpStatusColors = [
  { range: [200, 299], color: green },
  { range: [400, 499], color: yellow },
  { range: [500, 599], color: red },
] as const;
