import { afterEach, describe, expect, setSystemTime, test } from 'bun:test';

import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale';

import {
  type DateTimeZoneOptions,
  type FormatTimeOptions,
  type FormattedDateOptions,
  type Simplify,
  DEFAULT_DATETIME_TIMEZONE,
  formatTime,
  getFormattedDate,
  getFormattedTime,
  getUTCOffset,
  getZonedTime,
} from '@/index';

// == CompileTimeContracts =============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _DateTimeZoneOptionsContract = Assert<IsExact<DateTimeZoneOptions, { tz?: string }>>;
type _FormattedDateOptionsContract = Assert<
  IsExact<Simplify<FormattedDateOptions>, { tz?: string; withTime?: boolean }>
>;
type _FormatTimeOptionsContract = Assert<IsExact<Simplify<FormatTimeOptions>, { tz?: string; locale?: Locale }>>;

const FIXED_NOW = new Date('2024-01-02T00:04:05.678Z');

afterEach(() => {
  setSystemTime();
});

// == DatetimePolicies =================================================

describe('datetime policies', () => {
  test('publishes the default timezone used by omitted options', () => {
    expect(DEFAULT_DATETIME_TIMEZONE).toBe('Europe/London');
  });
});

// == TimezoneAwareFormatting ==========================================

describe('datetime utilities', () => {
  test('reports stable UTC offsets, including DST and fractional-hour zones', () => {
    expect(getUTCOffset(new Date('2024-01-15T12:00:00.000Z'), 'UTC')).toBe('(+0 UTC)');
    expect(getUTCOffset(new Date('2024-01-15T12:00:00.000Z'), 'America/New_York')).toBe('(-5 UTC)');
    expect(getUTCOffset(new Date('2024-07-15T12:00:00.000Z'), 'America/New_York')).toBe('(-4 UTC)');
    expect(getUTCOffset(new Date('2024-01-15T12:00:00.000Z'), 'Asia/Kathmandu')).toBe('(+5.75 UTC)');
  });

  test('projects the current instant into the requested timezone', () => {
    setSystemTime(FIXED_NOW);

    const utcNow = getZonedTime({ tz: 'UTC' });

    expect([
      utcNow.getFullYear(),
      utcNow.getMonth(),
      utcNow.getDate(),
      utcNow.getHours(),
      utcNow.getMinutes(),
      utcNow.getSeconds(),
    ]).toEqual([2024, 0, 2, 0, 4, 5]);
  });

  test('formats the current time with its explicit timezone context', () => {
    setSystemTime(FIXED_NOW);

    expect(getFormattedTime({ tz: 'UTC' })).toBe('00:04:05 (+0 UTC)');
    expect(getFormattedTime({ tz: 'Europe/Moscow' })).toBe('03:04:05 (+3 UTC)');
  });

  test('formats the current date with optional time and offset components', () => {
    setSystemTime(FIXED_NOW);

    expect(getFormattedDate({ tz: 'UTC' })).toBe('02.01.2024 00:04:05 (+0 UTC)');
    expect(getFormattedDate({ tz: 'Europe/Moscow', withTime: false })).toBe('02.01.2024');
  });

  test('formats an explicit instant with the requested locale and timezone', () => {
    expect(formatTime(FIXED_NOW, { locale: enUS, tz: 'UTC' })).toBe('00:04:05, 2 January 2024 (+0 UTC)');
    expect(formatTime(FIXED_NOW, { locale: enUS, tz: 'Europe/Moscow' })).toBe('03:04:05, 2 January 2024 (+3 UTC)');
  });

  test('keeps the offset attached to the original instant during an overlapping DST hour', () => {
    const firstLondonHour = new Date('2024-10-27T00:30:00.000Z');
    const repeatedLondonHour = new Date('2024-10-27T01:30:00.000Z');

    expect(formatTime(firstLondonHour, { locale: enUS, tz: 'Europe/London' })).toBe(
      '01:30:00, 27 October 2024 (+1 UTC)'
    );
    expect(formatTime(repeatedLondonHour, { locale: enUS, tz: 'Europe/London' })).toBe(
      '01:30:00, 27 October 2024 (+0 UTC)'
    );
  });
});
