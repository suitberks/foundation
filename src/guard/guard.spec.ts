import { describe, expect, test } from 'bun:test';

import { isBoolean, isByte, isFunction, isNil, isNotNil, isNumber, isObject, isString } from '@/index';

// These tests describe nullish, primitive, object, function, and binary runtime guards.
// They preserve exact narrowing contracts without coercing or normalizing supplied values.

// == CompileTimeContracts ==============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _IsNilContract = Assert<IsExact<typeof isNil, (value: unknown) => value is null | undefined>>;
type _IsNotNilContract = Assert<IsExact<typeof isNotNil, <TValue>(value: TValue) => value is NonNullable<TValue>>>;
type _IsBooleanContract = Assert<IsExact<typeof isBoolean, (value: unknown) => value is boolean>>;
type _IsNumberContract = Assert<IsExact<typeof isNumber, (value: unknown) => value is number>>;
type _IsByteContract = Assert<IsExact<typeof isByte, (value: unknown) => value is number>>;
type _IsStringContract = Assert<IsExact<typeof isString, (value: unknown) => value is string>>;
type _IsObjectContract = Assert<IsExact<typeof isObject, (value: unknown) => value is object>>;
type _IsFunctionContract = Assert<
  IsExact<typeof isFunction, (value: unknown) => value is CallableFunction | NewableFunction>
>;

test('runtime guards preserve their exact compile-time contracts', () => {
  const contracts: [
    _IsNilContract,
    _IsNotNilContract,
    _IsBooleanContract,
    _IsNumberContract,
    _IsByteContract,
    _IsStringContract,
    _IsObjectContract,
    _IsFunctionContract,
  ] = [true, true, true, true, true, true, true, true];

  expect(contracts).toEqual([true, true, true, true, true, true, true, true]);
});

// == NullishGuards =====================================================

describe('nullish guards', () => {
  test('distinguishes nullish values without excluding other falsy values', () => {
    expect(isNil(null)).toBe(true);
    expect(isNil(undefined)).toBe(true);
    expect(isNil(false)).toBe(false);
    expect(isNil(0)).toBe(false);
    expect(isNil('')).toBe(false);

    expect(isNotNil(null)).toBe(false);
    expect(isNotNil(undefined)).toBe(false);
    expect(isNotNil(false)).toBe(true);
    expect(isNotNil(0)).toBe(true);
    expect(isNotNil('')).toBe(true);
  });
});

// == PrimitiveGuards ===================================================

describe('primitive guards', () => {
  test('recognizes primitive booleans without coercing related values', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(0)).toBe(false);
    expect(isBoolean('false')).toBe(false);
    expect(isBoolean(new Boolean(true))).toBe(false);
  });

  test('recognizes every primitive number independently of numeric validity', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(NaN)).toBe(true);
    expect(isNumber(Infinity)).toBe(true);
    expect(isNumber('1')).toBe(false);
    expect(isNumber(new Number(1))).toBe(false);
  });

  test('recognizes primitive strings without excluding empty values', () => {
    expect(isString('')).toBe(true);
    expect(isString('value')).toBe(true);
    expect(isString(0)).toBe(false);
    expect(isString(new String('value'))).toBe(false);
  });
});

// == StructuredGuards ==================================================

describe('structured guards', () => {
  test('recognizes every non-null JavaScript object without narrowing its structure', () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
    expect(isObject(new Date())).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isObject(() => undefined)).toBe(false);
    expect(isObject('value')).toBe(false);
  });

  test('recognizes callable and constructable JavaScript function objects', () => {
    class Example {
      public readonly value = true;
    }

    expect(isFunction(() => undefined)).toBe(true);
    expect(isFunction(async () => undefined)).toBe(true);
    expect(isFunction(function* generate() {})).toBe(true);
    expect(isFunction(Example)).toBe(true);
    expect(isFunction({})).toBe(false);
    expect(isFunction(null)).toBe(false);
  });
});

// == BinaryGuards ======================================================

describe('binary guards', () => {
  test('recognizes unsigned bytes while rejecting values outside binary boundaries', () => {
    expect(isByte(0)).toBe(true);
    expect(isByte(0xff)).toBe(true);
    expect(isByte(-1)).toBe(false);
    expect(isByte(1.5)).toBe(false);
    expect(isByte(0x100)).toBe(false);
    expect(isByte(Infinity)).toBe(false);
  });
});
