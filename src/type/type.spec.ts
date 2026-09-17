import { expect, test } from 'bun:test';

import type { AtLeastOne, ExactlyOne, Simplify } from '@/index';

// These tests describe exact compile-time transformations provided by shared type utilities;
// They keep mapped contracts, selector exclusivity, and readable intersections type-safe;

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
  const contracts: [_SimplifyContract, _ExactlyOneContract, _AtLeastOneContract] = [true, true, true];

  expect(contracts).toEqual([true, true, true]);
});
