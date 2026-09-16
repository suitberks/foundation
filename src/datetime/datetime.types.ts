import type { Locale } from 'date-fns';

/**
 * Options selecting the timezone used by current-time datetime operations.
 * An omitted timezone preserves the shared London-based default behavior.
 */
export type DateTimeZoneOptions = {
  /**
   * IANA timezone used to project and format the current instant.
   * The shared London timezone applies when this option is omitted.
   */
  tz?: string;
};

/**
 * Options controlling current-date formatting and optional time inclusion.
 * Time output includes its UTC offset and remains enabled unless explicitly disabled.
 */
export type FormattedDateOptions = DateTimeZoneOptions & {
  /**
   * Controls whether wall-clock time and its UTC offset are included.
   * Time information remains enabled unless this option is explicitly `false`.
   */
  withTime?: boolean;
};

/**
 * Options controlling localized formatting for one explicit instant.
 * Russian localization and the shared timezone default apply when omitted.
 */
export type FormatTimeOptions = DateTimeZoneOptions & {
  /**
   * date-fns locale used for the textual calendar representation.
   * The Russian locale remains the default when this option is omitted.
   */
  locale?: Locale;
};
