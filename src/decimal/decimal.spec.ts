import { describe, expect, test } from 'bun:test';

import {
  type DecimalErrorCode,
  type DecimalFormat,
  type DecimalFormatOptions,
  decimalErrors,
  defineDecimalFormat,
  isDecimalString,
} from '@/index';

// These tests describe canonical decimal formats, recognition, defaults, and failures.
// They preserve exact public types and PostgreSQL-compatible decimal-string semantics.

// == CompileTimeContracts ==============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _DecimalFormatOptionsContract = Assert<
  IsExact<
    DecimalFormatOptions,
    Readonly<{
      precision: number;
      scale: number;
      signed?: boolean;
      zeroAllowed?: boolean;
    }>
  >
>;
type _DecimalFormatContract = Assert<
  IsExact<
    DecimalFormat,
    Readonly<{
      precision: number;
      scale: number;
      signed: boolean;
      zeroAllowed: boolean;
    }>
  >
>;
type _DecimalErrorCodeContract = Assert<
  IsExact<
    DecimalErrorCode,
    'invalidDecimalPrecision' | 'invalidDecimalScale' | 'invalidDecimalSignedPolicy' | 'invalidDecimalZeroPolicy'
  >
>;

// == FormatDefinitions =================================================

describe('decimal formats', () => {
  test('normalizes optional policies and returns an immutable format', () => {
    const format = defineDecimalFormat({ precision: 5, scale: 2 });

    expect(format).toEqual({ precision: 5, scale: 2, signed: false, zeroAllowed: true });
    expect(Object.isFrozen(format)).toBe(true);
  });

  test('preserves explicitly enabled sign and disabled zero policies', () => {
    expect(defineDecimalFormat({ precision: 5, scale: 2, signed: true, zeroAllowed: false })).toEqual({
      precision: 5,
      scale: 2,
      signed: true,
      zeroAllowed: false,
    });
  });

  test('rejects invalid precision and scale boundaries with stable error codes', () => {
    for (const precision of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity]) {
      expect(() => defineDecimalFormat({ precision, scale: 0 })).toThrow('invalidDecimalPrecision');
    }

    for (const scale of [-1, 1.5, 5, Number.MAX_SAFE_INTEGER + 1, Infinity]) {
      expect(() => defineDecimalFormat({ precision: 5, scale })).toThrow('invalidDecimalScale');
    }

    expect(decimalErrors.invalidDecimalPrecision().message).toBe('invalidDecimalPrecision');
    expect(decimalErrors.invalidDecimalScale().message).toBe('invalidDecimalScale');
  });

  test('rejects invalid runtime policies that bypass the static option contract', () => {
    expect(() =>
      Reflect.apply(defineDecimalFormat, undefined, [{ precision: 5, scale: 2, signed: 'enabled' }])
    ).toThrow('invalidDecimalSignedPolicy');
    expect(() =>
      Reflect.apply(defineDecimalFormat, undefined, [{ precision: 5, scale: 2, zeroAllowed: null }])
    ).toThrow('invalidDecimalZeroPolicy');
  });
});

// == StringRecognition =================================================

describe('decimal string recognition', () => {
  test('accepts canonical values within configured precision and scale', () => {
    const format = defineDecimalFormat({ precision: 5, scale: 2 });

    for (const value of ['0', '123', '123.45', '0.01']) {
      expect(isDecimalString(value, format)).toBe(true);
    }
  });

  test('rejects excess digits and non-canonical decimal representations', () => {
    const format = defineDecimalFormat({ precision: 5, scale: 2 });

    for (const value of ['1234', '123.456', '01', '01.20', '.5', '1.', '+1', '1e2', ' 1']) {
      expect(isDecimalString(value, format)).toBe(false);
    }
  });

  test('controls signed and zero values independently', () => {
    const unsignedFormat = defineDecimalFormat({ precision: 5, scale: 2 });
    const signedNonZeroFormat = defineDecimalFormat({ precision: 5, scale: 2, signed: true, zeroAllowed: false });

    expect(isDecimalString('-1.25', unsignedFormat)).toBe(false);
    expect(isDecimalString('-1.25', signedNonZeroFormat)).toBe(true);
    expect(isDecimalString('0', signedNonZeroFormat)).toBe(false);
    expect(isDecimalString('-0.00', signedNonZeroFormat)).toBe(false);
  });

  test('omits fractional values when configured scale is zero', () => {
    const format = defineDecimalFormat({ precision: 3, scale: 0 });

    expect(isDecimalString('999', format)).toBe(true);
    expect(isDecimalString('1.0', format)).toBe(false);
  });
});
