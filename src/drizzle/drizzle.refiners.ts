import { and, eq } from 'drizzle-orm';
import type { AnyColumn, SQL } from 'drizzle-orm';

// Default error message for when no defined conditions are provided to the `sqlWhere` function.
const AT_LEAST_ONE_DEFINED_CONDITION_ERROR = 'sqlWhere requires at least one defined condition.';

/**
 * Builds a Drizzle SQL `where` condition from a plain object.
 *
 * Maps each `where` entry to `eq(table[key], value)` and combines them with `and`.
 * Assumes that `where` was already validated and contains only existing table fields.
 *
 * ```ts
 * await db.update(usersTable).set(values).where(sqlWhere(usersTable, { id: 1 })).returning();
 * ```
 */
export function sqlWhere(table: unknown, where: Record<string, unknown>): SQL {
  const columns = table as Record<string, AnyColumn>;
  const conditions = Object.entries(where)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => eq(columns[key]!, value));

  if (conditions.length === 0) {
    throw new Error(AT_LEAST_ONE_DEFINED_CONDITION_ERROR);
  }

  return and(...conditions)!;
}
