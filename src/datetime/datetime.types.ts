import type { Locale } from 'date-fns';

/**
 * Options selecting the timezone used by current-time datetime operations.
 * An omitted timezone preserves the shared London-based default behavior.
 */
export type DateTimeZoneOptions = {
  /**
   * IANA timezone used to project and format the current instant in time.
   * The shared London timezone applies whenever this option is omitted.
   */
  tz?: string;
};

/**
 * Options controlling current-date formatting and the optional time component.
 * Time output includes its UTC offset and stays on unless explicitly disabled.
 */
export type FormattedDateOptions = DateTimeZoneOptions & {
  /**
   * Controls whether wall-clock time and its UTC offset are both included.
   * Time information stays enabled unless this option is explicitly `false`.
   */
  withTime?: boolean;
};

/**
 * Options controlling localized formatting for one explicit instant in time.
 * British English and the shared timezone default apply when they are omitted.
 */
export type FormatTimeOptions = DateTimeZoneOptions & {
  /**
   * date-fns locale used for the textual calendar date representation.
   * British English remains the default whenever this option is omitted.
   */
  locale?: Locale;
};
