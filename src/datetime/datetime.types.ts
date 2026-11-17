import type { Locale } from 'date-fns';

/**
 * Options selecting the IANA timezone used by current-time datetime operations.
 * An omitted timezone keeps the shared `Europe/London` default for all calls.
 */
export type DateTimeZoneOptions = {
  tz?: string;
};

/**
 * Options controlling current-date formatting and the optional time component.
 * Time output includes its UTC offset and stays on unless explicitly disabled.
 */
export type FormattedDateOptions = DateTimeZoneOptions & {
  withTime?: boolean;
};

/**
 * Options controlling localized formatting for one explicit instant in time.
 * British English and the shared timezone default apply when they are omitted.
 */
export type FormatTimeOptions = DateTimeZoneOptions & {
  locale?: Locale;
};
