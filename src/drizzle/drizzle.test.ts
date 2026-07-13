import { describe, expect, test } from 'bun:test';
import { SQLiteSyncDialect, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { sqlWhere } from '../index';

// =====================================================================================================================
// Shared SQL representation — compile through Drizzle's public SQLite dialect instead of inspecting SQL internals.
// =====================================================================================================================

const usersTable = sqliteTable('users', {
  id: integer('id'),
  displayName: text('display_name'),
  active: integer('active', { mode: 'boolean' }),
});

const sqliteDialect = new SQLiteSyncDialect();

/**
 * Compiles a where fragment into Drizzle's stable public query representation.
 * Returning only SQL and parameters keeps assertions independent of optional typing metadata.
 */
function compileWhere(where: Record<string, unknown>): { sql: string; params: unknown[] } {
  const { sql, params } = sqliteDialect.sqlToQuery(sqlWhere(usersTable, where));
  return { sql, params };
}

// =====================================================================================================================
// Defined conditions — keys become qualified columns, while values remain safely parameterized by Drizzle.
// =====================================================================================================================

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
});

// =====================================================================================================================
// Undefined and empty input — undefined means “omit this condition”, but an empty result must never create a broad query.
// =====================================================================================================================

describe('sqlWhere omitted conditions', () => {
  test('filters undefined values while retaining the remaining conditions', () => {
    expect(compileWhere({ id: undefined, displayName: 'Ada', active: undefined })).toEqual({
      sql: '"users"."display_name" = ?',
      params: ['Ada'],
    });
  });

  test('throws the documented safety error for an empty object', () => {
    expect(() => sqlWhere(usersTable, {})).toThrow('sqlWhere requires at least one defined condition.');
  });

  test('throws the same safety error when every supplied value is undefined', () => {
    expect(() => sqlWhere(usersTable, { id: undefined, displayName: undefined })).toThrow(
      'sqlWhere requires at least one defined condition.'
    );
  });
});
