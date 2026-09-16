import { format } from 'date-fns';
import { getTimezoneOffset, toZonedTime } from 'date-fns-tz';
import { ru } from 'date-fns/locale';

import {
  DATETIME_DATE_PATTERN,
  DATETIME_LOCALIZED_PATTERN,
  DATETIME_TIME_PATTERN,
  DEFAULT_DATETIME_TIMEZONE,
} from './datetime.constants';
import type { DateTimeZoneOptions, FormatTimeOptions, FormattedDateOptions } from './datetime.types';

/**
 * Projects the current instant onto the wall-clock fields of another timezone.
 * The timezone defaults to `Europe/London` when no option is provided.
 *
 * @example
 * const londonTime = getZonedTime({ tz: 'Europe/London' });
 */
export function getZonedTime({ tz = DEFAULT_DATETIME_TIMEZONE }: DateTimeZoneOptions = {}): Date {
  return toZonedTime(new Date(), tz);
}

/**
 * Formats the UTC offset of a timezone at the supplied date.
 * An explicit date preserves daylight-saving and historical offset rules.
 *
 * @example
 * getUTCOffset(date, 'Europe/Moscow'); // `(+3 UTC)`
 */
export function getUTCOffset(date: Date, tz: string): string {
  const offset = getTimezoneOffset(tz, date) / (60 * 60 * 1000);
  return `(${offset >= 0 ? '+' : ''}${offset} UTC)`;
}

/**
 * Formats the current time and UTC offset in the selected timezone.
 * The timezone defaults to `Europe/London` when no option is provided.
 *
 * @example
 * getFormattedTime({ tz: 'Europe/Moscow' }); // `03:04:05 (+3 UTC)`
 */
export function getFormattedTime({ tz = DEFAULT_DATETIME_TIMEZONE }: DateTimeZoneOptions = {}): string {
  const currentTime = new Date();
  const zonedTime = toZonedTime(currentTime, tz);

  return `${format(zonedTime, DATETIME_TIME_PATTERN)} ${getUTCOffset(currentTime, tz)}`;
}

/**
 * Formats the current date with optional time and UTC offset components.
 * Time is included by default and uses the selected timezone for display.
 *
 * @example
 * getFormattedDate({ tz: 'UTC', withTime: false }); // `02.01.2024`
 */
export function getFormattedDate({
  tz = DEFAULT_DATETIME_TIMEZONE,
  withTime = true,
}: FormattedDateOptions = {}): string {
  const currentTime = new Date();
  const zonedTime = toZonedTime(currentTime, tz);
  const pattern = withTime ? `${DATETIME_DATE_PATTERN} ${DATETIME_TIME_PATTERN}` : DATETIME_DATE_PATTERN;
  const formatted = format(zonedTime, pattern);

  return `${formatted}${withTime ? ` ${getUTCOffset(currentTime, tz)}` : ''}`;
}

/**
 * Formats an explicit instant in another timezone using the selected locale.
 * The result includes localized date text, wall-clock time, and UTC offset.
 *
 * @example
 * formatTime(date, { locale: ru, tz: 'Europe/Moscow' });
 */
export function formatTime(time: Date, options: FormatTimeOptions = {}): string {
  const { locale = ru, tz = DEFAULT_DATETIME_TIMEZONE } = options;
  const zonedTime = toZonedTime(time, tz);

  return `${format(zonedTime, DATETIME_LOCALIZED_PATTERN, { locale })} ${getUTCOffset(time, tz)}`;
}
