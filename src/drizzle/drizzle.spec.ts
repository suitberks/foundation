import { describe, expect, test } from 'bun:test';

import { SQLiteDialect, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { type DrizzleErrorCode, type SQLWhereConditions, drizzleErrors, sqlWhere } from '@/index';

// These tests cover typed Drizzle equality conditions, omission, and mutation safety behavior;
// They preserve exact public contracts and stable errors through compiled SQL representations;

// == CompileTimeContracts ==============================================

type IsExact<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends <Value>() => Value extends Expected ? 1 : 2
    ? (<Value>() => Value extends Expected ? 1 : 2) extends <Value>() => Value extends Actual ? 1 : 2
      ? true
      : false
    : false;

type Assert<Condition extends true> = Condition;

const usersTable = sqliteTable('users', {
  id: integer('id'),
  displayName: text('display_name'),
  active: integer('active', { mode: 'boolean' }),
});

const sqliteDialect = new SQLiteDialect();

type _SQLWhereConditionsContract = Assert<
  IsExact<
    SQLWhereConditions<typeof usersTable>,
    Partial<{ id: number | null; displayName: string | null; active: boolean | null }>
  >
>;
type _DrizzleErrorCodeContract = Assert<IsExact<DrizzleErrorCode, 'whereConditionsRequired' | 'whereColumnNotFound'>>;

function assertRejectedConditions(): void {
  // @ts-expect-error Unknown conditions cannot address columns outside the supplied table.
  sqlWhere(usersTable, { unknownColumn: 'value' });

  // @ts-expect-error Condition values must match their corresponding selected column type.
  sqlWhere(usersTable, { id: '42' });
}

void assertRejectedConditions;

// == SharedSQLRepresentation ==========================================

// Compiles a where fragment into Drizzle's stable public query representation.
// Returning SQL and parameters avoids assertions against optional typing metadata.
function compileWhere(where: SQLWhereConditions<typeof usersTable>): { sql: string; params: unknown[] } {
  const { sql, params } = sqliteDialect.sqlToQuery(sqlWhere(usersTable, where));
  return { sql, params };
}

// == DrizzleErrors =====================================================

describe('drizzle errors', () => {
  test('creates stable machine-readable failures for invalid where conditions', () => {
    const missingConditionsError = drizzleErrors.whereConditionsRequired();
    const unknownColumnError = drizzleErrors.whereColumnNotFound();

    expect(missingConditionsError).toBeInstanceOf(Error);
    expect(missingConditionsError.message).toBe('whereConditionsRequired');
    expect(unknownColumnError).toBeInstanceOf(Error);
    expect(unknownColumnError.message).toBe('whereColumnNotFound');
  });
});

// == DefinedSQLConditions =============================================

describe('sqlWhere defined conditions', () => {
  test('builds a single equality condition', () => {
    expect(compileWhere({ id: 42 })).toEqual({
      sql: '"users"."id" = ?',
      params: [42],
    });
  });

  test('combines multiple conditions in object-entry order', () => {
    expect(compileWhere({ id: 42, displayName: 'Ada', active: true })).toEqual({
      sql: '(("users"."id" = ?) and ("users"."display_name" = ?) and ("users"."active" = ?))',
      params: [42, 'Ada', 1],
    });
  });

  test('preserves defined falsy values instead of treating them as absent', () => {
    expect(compileWhere({ id: 0, displayName: '', active: false })).toEqual({
      sql: '(("users"."id" = ?) and ("users"."display_name" = ?) and ("users"."active" = ?))',
      params: [0, '', 0],
    });
  });

  test('uses SQL null semantics for nullable conditions', () => {
    expect(compileWhere({ displayName: null })).toEqual({
      sql: '("users"."display_name" is null)',
      params: [],
    });
  });
});

// == OmittedSQLConditions =============================================

describe('sqlWhere omitted conditions', () => {
  test('filters undefined values while retaining the remaining conditions', () => {
    expect(compileWhere({ id: undefined, displayName: 'Ada', active: undefined })).toEqual({
      sql: '"users"."display_name" = ?',
      params: ['Ada'],
    });
  });

  test('throws the documented safety error for an empty object', () => {
    expect(() => sqlWhere(usersTable, {})).toThrow('whereConditionsRequired');
  });

  test('throws the same safety error when every supplied value is undefined', () => {
    expect(() => sqlWhere(usersTable, { id: undefined, displayName: undefined })).toThrow('whereConditionsRequired');
  });

  test('rejects unknown columns that bypass the static condition contract', () => {
    const invalidWhere = { unknownColumn: 'value' } as SQLWhereConditions<typeof usersTable>;

    expect(() => sqlWhere(usersTable, invalidWhere)).toThrow('whereColumnNotFound');
  });
});
