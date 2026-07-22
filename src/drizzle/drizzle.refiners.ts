import { and, eq } from 'drizzle-orm';
import type { AnyColumn, SQL } from 'drizzle-orm';

// Shared error message keeps empty `WHERE` failures consistent across callers and tests;
// The guard prevents accidentally executing a query without any defined conditions;

const AT_LEAST_ONE_DEFINED_CONDITION_ERROR = 'sqlWhere requires at least one defined condition.';

/**
 * Builds a Drizzle `WHERE` clause by combining defined object entries with `and`.
 * Expects the supplied keys to be validated against the table beforehand.
 *
 * @example
 * await db.update(usersTable).set(values).where(sqlWhere(usersTable, { id: 1 })).returning();
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
