import { enGB } from 'date-fns/locale';

/**
 * Default timezone applied by datetime utilities when no explicit zone is provided.
 * The value preserves the package's historical London-based formatting behavior.
 */
export const DEFAULT_DATETIME_TIMEZONE = 'Europe/London';

/**
 * Default date-fns locale applied by localized formatting when none is provided.
 * British English keeps English month names in the European day-first order.
 */
export const DEFAULT_DATETIME_LOCALE = enGB;

/**
 * Numeric calendar date pattern used by date-fns formatting utilities.
 * Day-first digits omit any timezone, offset, or localized month names.
 */
export const DATETIME_DATE_PATTERN = 'dd.MM.yyyy';

/**
 * Twenty-four-hour wall-clock time pattern used by date-fns formatting.
 * Seconds stay included while timezone offsets are appended separately.
 */
export const DATETIME_TIME_PATTERN = 'HH:mm:ss';

/**
 * Localized long date and wall-clock time pattern for human-readable output.
 * Month names follow the selected date-fns locale in a day-first written order.
 */
export const DATETIME_LOCALIZED_PATTERN = 'HH:mm:ss, d MMMM yyyy';
