import { type Locale, format } from 'date-fns';
import { getTimezoneOffset, toZonedTime } from 'date-fns-tz';
import { ru } from 'date-fns/locale';

/**
 * Returns the current time in the specified timezone.
 * Example: getZonedTime({ tz: 'America/New_York' }) = new Date('2026-03-15T12:00:00Z')
 */
export const getZonedTime = ({ tz = 'Europe/London' }: { tz?: string } = {}): Date => {
  return toZonedTime(new Date(), tz);
};

/**
 * Returns the timezone offset in the format (+4 UTC) / (-5 UTC).
 * Example: getUTCOffset(new Date('2026-03-15T12:00:00Z'), 'America/New_York') = '(-4 UTC)'
 */
export const getUTCOffset = (date: Date, tz: string): string => {
  const offset = getTimezoneOffset(tz, date) / (60 * 60 * 1000);
  return `(${offset >= 0 ? '+' : ''}${offset} UTC)`;
};

/**
 * Returns the current time in the specified timezone, formatted as HH:mm:ss (+X UTC).
 * Example: getFormattedTime({ tz: 'America/New_York' }) = '12:00:00 (-4 UTC)'
 */
export const getFormattedTime = ({ tz = 'Europe/London' }: { tz?: string } = {}): string => {
  const zonedTime = getZonedTime({ tz });
  return `${format(zonedTime, 'HH:mm:ss')} ${getUTCOffset(zonedTime, tz)}`;
};

/**
 * Returns the current date in the specified timezone, formatted as dd.MM.yyyy.
 * By default, it also includes time (HH:mm:ss) and timezone offset.
 * Example: getFormattedDate({ tz: 'America/New_York' }) = '03.15.2026 12:00:00 (-4 UTC)'
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
 * Formats the given time in the specified timezone, using the provided locale for date formatting.
 * Example: formatTime(new Date('2026-03-15T12:00:00Z'), { tz: 'America/New_York' }) = '12:00:00, March 15, 2026 (-4 UTC)'
 */
export const formatTime = (
  time: Date,
  { locale = ru, tz = 'Europe/London' }: { locale?: Locale; tz?: string } = {}
): string => {
  const zonedTime = toZonedTime(time, tz);

  return `${format(zonedTime, 'HH:mm:ss, d MMMM yyyy', { locale })} ${getUTCOffset(zonedTime, tz)}`;
};
