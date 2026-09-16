import type { InferSelectModel, Table } from 'drizzle-orm';

/**
 * Defined equality conditions accepted by `sqlWhere` for one Drizzle table.
 * Keys and values remain aligned with the table's inferred selected row model.
 */
export type SQLWhereConditions<TTable extends Table> = Partial<InferSelectModel<TTable>>;
