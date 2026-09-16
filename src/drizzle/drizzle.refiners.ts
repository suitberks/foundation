import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import type { AnyColumn, SQL, Table } from 'drizzle-orm';

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
  const columns = getTableColumns(table);

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

  if (conditions.length === 0) {
    throw drizzleErrors.whereConditionsRequired();
  }

  // Drizzle returns `undefined` only for the empty condition collection rejected above.
  return and(...conditions)!;
}
