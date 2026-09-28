import type { AnyColumn, SQL, Table } from 'drizzle-orm';
import { and, eq, getColumns, isNull } from 'drizzle-orm';

import { drizzleErrors } from './drizzle.errors';
import type { SQLWhereConditions } from './drizzle.types';

/**
 * Builds a Drizzle `WHERE` clause by combining defined object entries with `and`.
 * Keys and values follow the table model while empty conditions remain forbidden.
 *
 * @example
 * await db.update(usersTable).set(values).where(sqlWhere(usersTable, { id: 1 })).returning();
 */
export function sqlWhere<TTable extends Table>(table: TTable, where: SQLWhereConditions<NoInfer<TTable>>): SQL {
  const columns = getColumns(table);

  // Restore the key-column relation erased by `Object.entries` and generic indexed access.
  const entries = Object.entries(where) as Array<[keyof typeof columns, unknown]>;

  const conditions = entries
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const column = columns[key] as AnyColumn | undefined;

      // Reject runtime keys that entered outside the statically typed boundary.
      if (column === undefined) throw drizzleErrors.whereColumnNotFound();

      // Preserve SQL null semantics instead of emitting an ineffective `= NULL` comparison.
      return value === null ? isNull(column) : eq(column, value);
    });

  // ↓ Narrow Drizzle's optional result while preserving the empty-condition safety guard.

  const condition = and(...conditions);

  if (condition === undefined) {
    throw drizzleErrors.whereConditionsRequired();
  }

  return condition;
}

/**
 * Builds an optional Drizzle `WHERE` clause for explicitly omitted conditions.
 * Provided objects retain every validation and failure of strict `sqlWhere`.
 *
 * @example
 * await db.select().from(usersTable).where(sqlWhereOptional(usersTable, filters));
 */
export function sqlWhereOptional<TTable extends Table>(
  table: TTable,
  where: SQLWhereConditions<NoInfer<TTable>> | undefined
): SQL | undefined {
  if (where === undefined) return undefined;

  return sqlWhere(table, where);
}
