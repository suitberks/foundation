import { and, eq } from 'drizzle-orm';
import type { AnyColumn, SQL } from 'drizzle-orm';

/**
 * Builds a Drizzle SQL `where` condition from a plain object.
 *
 * Maps each `where` entry to `eq(table[key], value)` and combines them with `and`.
 * Assumes that `where` was already validated and contains only existing table fields.
 *
 * ```ts
 * await db
 *   .update(usersTable)
 *   .set(values)
 *   .where(sqlWhere(usersTable, { id: 1 }))
 *   .returning();
 * ```
 */
export function sqlWhere(table: unknown, where: Record<string, unknown>): SQL | undefined {
  return and(...Object.entries(where).map(([key, value]) => eq((table as Record<string, AnyColumn>)[key]!, value)));
}
