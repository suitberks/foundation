import { type Locale, format } from 'date-fns';
import { getTimezoneOffset, toZonedTime } from 'date-fns-tz';
import { ru } from 'date-fns/locale';

/**
 * Returns the current date and time shifted to the specified timezone.
 *
 * This is useful when the application needs to display "now" from another
 * region's point of view instead of relying on the server's local timezone.
 */
export const getZonedTime = ({ tz = 'Europe/London' }: { tz?: string } = {}): Date => {
  return toZonedTime(new Date(), tz);
};

/**
 * Returns the UTC offset for the specified timezone at the given date.
 *
 * The offset is formatted for display next to dates and times, for example
 * `(+4 UTC)`, `(0 UTC)`, or `(-5 UTC)`. The date is required because timezone
 * offsets may change depending on daylight saving time or historical rules.
 */
export const getUTCOffset = (date: Date, tz: string): string => {
  const offset = getTimezoneOffset(tz, date) / (60 * 60 * 1000);
  return `(${offset >= 0 ? '+' : ''}${offset} UTC)`;
};

/**
 * Returns the current time formatted in the specified timezone.
 *
 * The result includes both the local time and its UTC offset, making it suitable
 * for UI labels, logs, bot messages, and other places where the user should see
 * not only the time itself, but also the timezone context behind that value.
 *
 * Format: `HH:mm:ss (+X UTC)`.
 */
export const getFormattedTime = ({ tz = 'Europe/London' }: { tz?: string } = {}): string => {
  const zonedTime = getZonedTime({ tz });
  return `${format(zonedTime, 'HH:mm:ss')} ${getUTCOffset(zonedTime, tz)}`;
};

/**
 * Returns the current date formatted in the specified timezone.
 *
 * By default, the result includes date, time, and UTC offset. This is useful for
 * complete timestamps displayed in UI, bot messages, reports, or diagnostics.
 *
 * Format with time: `dd.MM.yyyy HH:mm:ss (+X UTC)`.
 * Format without time: `dd.MM.yyyy`.
 */
export const getFormattedDate = ({
  tz = 'Europe/London',
  withTime = true,
}: { tz?: string; withTime?: boolean } = {}): string => {
  const zonedTime = getZonedTime({ tz });

  const pattern = withTime ? 'dd.MM.yyyy HH:mm:ss' : 'dd.MM.yyyy';
  const formatted = format(zonedTime, pattern);

  return `${formatted}${withTime ? ` ${getUTCOffset(zonedTime, tz)}` : ''}`;
};

/**
 * Formats the provided date and time in the specified timezone.
 *
 * Unlike helpers that always use the current moment, this function accepts an
 * explicit Date value and formats that exact point in time for another timezone.
 *
 * Format: `HH:mm:ss, d MMMM yyyy (+X UTC)`.
 */
export const formatTime = (
  time: Date,
  { locale = ru, tz = 'Europe/London' }: { locale?: Locale; tz?: string } = {}
): string => {
  const zonedTime = toZonedTime(time, tz);

  return `${format(zonedTime, 'HH:mm:ss, d MMMM yyyy', { locale })} ${getUTCOffset(zonedTime, tz)}`;
};
