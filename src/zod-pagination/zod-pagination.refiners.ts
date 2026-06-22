// import type { ZodPaginationOptions } from './zod-pagination.schemas';

// /**
//  * Extracts defined pagination options from a query object.
//  *
//  * This keeps query builder calls clean by omitting undefined values while
//  * preserving valid pagination values like `0`, useful when spreading pagination
//  * options into APIs that expect only explicitly provided fields (e.g., Drizzle).
//  *
//  * ```ts
//  * await db.query.someTable.findMany({
//  *   ...refinePagination(options),
//  * });
//  * ```
//  */
// export const refinePagination = (options?: ZodPaginationOptions): ZodPaginationOptions => ({
//   ...(options?.offset !== undefined ? { offset: options.offset } : {}),
//   ...(options?.limit !== undefined ? { limit: options.limit } : {}),
// });
