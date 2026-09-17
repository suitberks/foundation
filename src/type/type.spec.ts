import { describe, expect, test } from 'bun:test';

import {
  type AtLeastOne,
  type ExactlyOne,
  type Simplify,
  isBoolean,
  isByte,
  isNil,
  isNotNil,
  isNumber,
  isString,
} from '@/index';

// These tests describe exact transformations and runtime narrowing from shared type utilities;
// They preserve mapped contracts and primitive guards across frontend and backend consumers;

// == CompileTimeContracts ==============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _SimplifyContract = Assert<
  IsExact<Simplify<{ identifier: string } & { enabled?: boolean }>, { identifier: string; enabled?: boolean }>
>;
type _ExactlyOneContract = Assert<
  IsExact<
    ExactlyOne<{ id: string; email: string; fullName: string }, 'id' | 'email'>,
    { id: string; email?: never } | { email: string; id?: never }
  >
>;
type _AtLeastOneContract = Assert<
  IsExact<
    AtLeastOne<{ name?: string; count?: number; enabled: boolean }, 'name' | 'count'>,
    { name: string; count?: number; enabled?: boolean } | { count: number; name?: string; enabled?: boolean }
  >
>;
type _IsNilContract = Assert<IsExact<typeof isNil, (value: unknown) => value is null | undefined>>;
type _IsNotNilContract = Assert<IsExact<typeof isNotNil, <TValue>(value: TValue) => value is NonNullable<TValue>>>;
type _IsBooleanContract = Assert<IsExact<typeof isBoolean, (value: unknown) => value is boolean>>;
type _IsNumberContract = Assert<IsExact<typeof isNumber, (value: unknown) => value is number>>;
type _IsByteContract = Assert<IsExact<typeof isByte, (value: unknown) => value is number>>;
type _IsStringContract = Assert<IsExact<typeof isString, (value: unknown) => value is string>>;

function assertRejectedAtLeastOneShapes(): void {
  // @ts-expect-error At least one selected property must hold a concrete value.
  const emptyPatch: AtLeastOne<{ name?: string; count?: number }> = {};

  // @ts-expect-error Explicit undefined does not satisfy a selected property branch.
  const undefinedPatch: AtLeastOne<{ name?: string; count?: number }> = { name: undefined };

  void emptyPatch;
  void undefinedPatch;
}

void assertRejectedAtLeastOneShapes;

test('type utilities preserve their exact compile-time contracts', () => {
  const contracts: [
    _SimplifyContract,
    _ExactlyOneContract,
    _AtLeastOneContract,
    _IsNilContract,
    _IsNotNilContract,
    _IsBooleanContract,
    _IsNumberContract,
    _IsByteContract,
    _IsStringContract,
  ] = [true, true, true, true, true, true, true, true, true];

  expect(contracts).toEqual([true, true, true, true, true, true, true, true, true]);
});

// == RuntimePredicates =================================================

describe('nullish predicates', () => {
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

describe('primitive predicates', () => {
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

  test('recognizes unsigned bytes while rejecting values outside binary boundaries', () => {
    expect(isByte(0)).toBe(true);
    expect(isByte(0xff)).toBe(true);
    expect(isByte(-1)).toBe(false);
    expect(isByte(1.5)).toBe(false);
    expect(isByte(0x100)).toBe(false);
    expect(isByte(Infinity)).toBe(false);
  });

  test('recognizes primitive strings without excluding empty values', () => {
    expect(isString('')).toBe(true);
    expect(isString('value')).toBe(true);
    expect(isString(0)).toBe(false);
    expect(isString(new String('value'))).toBe(false);
  });
});
