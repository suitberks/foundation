/**
 * Default timezone applied by datetime utilities when no explicit zone is provided.
 * The value preserves the package's historical London-based formatting behavior.
 */
export const DEFAULT_DATETIME_TIMEZONE = 'Europe/London';

export const DATETIME_DATE_PATTERN = 'dd.MM.yyyy'; // ← Numeric calendar date without timezone metadata.
export const DATETIME_TIME_PATTERN = 'HH:mm:ss'; // ← Twenty-four-hour wall-clock time without an offset.
export const DATETIME_LOCALIZED_PATTERN = 'HH:mm:ss, d MMMM yyyy'; // ← Localized long date and wall-clock time.
