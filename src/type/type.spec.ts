import { expect, test } from 'bun:test';

import type { Simplify } from '@/index';

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

test('Simplify flattens intersections while preserving property modifiers', () => {
  const contract: _SimplifyContract = true;

  expect(contract).toBe(true);
});
