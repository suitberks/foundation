import { blue, green, red, yellow } from 'kleur/colors';

import type { LogLevel } from './logging.enums';
import { logLevel } from './logging.enums';

/**
 * Terminal color configuration assigned to every supported logging level.
 * The `LogLevel` contract prevents missing or unsupported level entries.
 */
export const LOG_LEVEL_COLORS = {
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
 * Normalized key fragments that are treated as sensitive by logging redaction.
 * Matching ignores case and separators so compound field names remain covered.
 */
export const SENSITIVE_LOG_KEY_PARTS = [
  'password',
  'passwd',
  'token',
  'secret',
  'authorization',
  'apikey',
  'credential',
  'cookie',
  'session',
  'cvv',
] as const;

/**
 * Number of characters retained from each edge of an oversized request body.
 * The complete preview includes both edges separated by one explicit ellipsis.
 */
export const LOG_BODY_PREVIEW_EDGE_LENGTH = 30;

/**
 * Maximum request-body size in bytes read while building one log preview.
 * Larger bodies stop being buffered and emit a safe placeholder instead.
 */
export const LOG_BODY_PREVIEW_MAX_BYTES = 64 * 1024;

/**
 * Safe request-body placeholder emitted instead of reading multipart content.
 * Skipping multipart reads keeps file payloads out of logs and memory copies.
 */
export const MULTIPART_LOG_BODY = '[multipart]';

/**
 * Safe request-body placeholder emitted instead of previewing an oversized payload.
 * Partial content is never logged because incomplete JSON cannot be redacted safely.
 */
export const OVERSIZED_LOG_BODY = '[oversized]';

/**
 * Terminal colors assigned to every supported HTTP response status range.
 * Unlisted ranges intentionally retain the terminal's default appearance.
 */
export const HTTP_STATUS_COLORS = [
  { range: [200, 299], color: green },
  { range: [400, 499], color: yellow },
  { range: [500, 599], color: red },
] as const;
