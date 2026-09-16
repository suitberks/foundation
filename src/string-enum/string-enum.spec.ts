import { describe, expect, test } from 'bun:test';

import {
  type ReplaceDotsWithUnderscores,
  type ReplaceHyphensWithUnderscores,
  type SeparateCamelCase,
  type StringEnumKey,
  type StringEnumRecord,
  createStringEnumRecord,
} from '@/index';

// == CompileTimeContracts =============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _ReplaceDotsContract = Assert<
  IsExact<ReplaceDotsWithUnderscores<'foundation.enum.deep.value'>, 'foundation_enum_deep_value'>
>;
type _ReplaceDotsWithoutDotsContract = Assert<IsExact<ReplaceDotsWithUnderscores<'unchanged'>, 'unchanged'>>;
type _ReplaceHyphensContract = Assert<
  IsExact<ReplaceHyphensWithUnderscores<'foundation-enum-deep-value'>, 'foundation_enum_deep_value'>
>;
type _ReplaceHyphensWithoutHyphensContract = Assert<IsExact<ReplaceHyphensWithUnderscores<'unchanged'>, 'unchanged'>>;
type _SeparateCamelCaseContract = Assert<IsExact<SeparateCamelCase<'waitingForReview'>, 'waiting_For_Review'>>;
type _StringEnumKeyContract = Assert<IsExact<StringEnumKey<'waitingForReview'>, 'WAITING_FOR_REVIEW'>>;
type _StringEnumRecordContract = Assert<
  IsExact<
    StringEnumRecord<readonly ['user.active', 'pending-review']>,
    Readonly<{ USER_ACTIVE: 'user.active'; PENDING_REVIEW: 'pending-review' }>
  >
>;
type _CamelCaseStringEnumRecordContract = Assert<
  IsExact<
    StringEnumRecord<readonly ['waitingForReview', 'fileSizeExceeded']>,
    Readonly<{ WAITING_FOR_REVIEW: 'waitingForReview'; FILE_SIZE_EXCEEDED: 'fileSizeExceeded' }>
  >
>;

// == StringEnumRecords ================================================

describe('createStringEnumRecord', () => {
  test('normalizes camelCase, dots, and hyphens while preserving literal values', () => {
    const statuses = createStringEnumRecord([
      'draft',
      'review.in.progress',
      'published-value',
      'waitingForReview',
    ] as const);

    expect(statuses).toEqual({
      DRAFT: 'draft',
      REVIEW_IN_PROGRESS: 'review.in.progress',
      PUBLISHED_VALUE: 'published-value',
      WAITING_FOR_REVIEW: 'waitingForReview',
    });
  });

  test('returns a frozen record so runtime behavior matches its readonly type', () => {
    const statuses = createStringEnumRecord(['draft'] as const);

    expect(Object.isFrozen(statuses)).toBe(true);
    expect(() => Reflect.set(statuses, 'DRAFT', 'published')).not.toThrow();
    expect(statuses.DRAFT).toBe('draft');
  });

  test('supports an empty readonly source without adding synthetic members', () => {
    expect(createStringEnumRecord([] as const)).toEqual({});
  });
});
