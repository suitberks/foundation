import { expect, test } from 'bun:test';

import type { ExactlyOne, Simplify } from '@/index';

// These tests describe exact compile-time transformations provided by shared type utilities;
// They keep selector exclusivity and intersection flattening visible to project typechecking;

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _ExactlyOneContract = Assert<
  IsExact<
    ExactlyOne<{ id: string; email: string; fullName: string }, 'id' | 'email'>,
    { id: string; email?: never } | { email: string; id?: never }
  >
>;
type _SimplifyContract = Assert<
  IsExact<Simplify<{ identifier: string } & { enabled?: boolean }>, { identifier: string; enabled?: boolean }>
>;

test('type utilities preserve their exact compile-time contracts', () => {
  const contracts: [_ExactlyOneContract, _SimplifyContract] = [true, true];

  expect(contracts).toEqual([true, true]);
});
