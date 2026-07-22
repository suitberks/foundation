import { type Locale, format } from 'date-fns';
import { getTimezoneOffset, toZonedTime } from 'date-fns-tz';
import { ru } from 'date-fns/locale';

/**
 * Projects the current instant onto the wall-clock fields of another timezone.
 * The timezone defaults to `Europe/London` when no option is provided.
 *
 * @example
 * const londonTime = getZonedTime({ tz: 'Europe/London' });
 */
export function getZonedTime({ tz = 'Europe/London' }: { tz?: string } = {}): Date {
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
export function getFormattedTime({ tz = 'Europe/London' }: { tz?: string } = {}): string {
  const zonedTime = getZonedTime({ tz });
  return `${format(zonedTime, 'HH:mm:ss')} ${getUTCOffset(zonedTime, tz)}`;
}

/**
 * Formats the current date with optional time and UTC offset components.
 * Time is included by default and uses the selected timezone for display.
 *
 * @example
 * getFormattedDate({ tz: 'UTC', withTime: false }); // `02.01.2024`
 */
export function getFormattedDate({
  tz = 'Europe/London',
  withTime = true,
}: { tz?: string; withTime?: boolean } = {}): string {
  const zonedTime = getZonedTime({ tz });

  const pattern = withTime ? 'dd.MM.yyyy HH:mm:ss' : 'dd.MM.yyyy';
  const formatted = format(zonedTime, pattern);

  return `${formatted}${withTime ? ` ${getUTCOffset(zonedTime, tz)}` : ''}`;
}

/**
 * Formats an explicit instant in another timezone using the selected locale.
 * The result includes localized date text, wall-clock time, and UTC offset.
 *
 * @example
 * formatTime(date, { locale: ru, tz: 'Europe/Moscow' });
 */
export function formatTime(
  time: Date,
  { locale = ru, tz = 'Europe/London' }: { locale?: Locale; tz?: string } = {}
): string {
  const zonedTime = toZonedTime(time, tz);

  return `${format(zonedTime, 'HH:mm:ss, d MMMM yyyy', { locale })} ${getUTCOffset(zonedTime, tz)}`;
}
