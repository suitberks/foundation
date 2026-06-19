import type { PaginationOptions } from './pagination.schemas';

/**
 * A utility function that extracts pagination options from the provided input.
 * It returns an object containing the `offset` and `limit` properties if they are defined.
 * If the input is undefined or does not contain these properties, it returns an empty object.
 *
 * ```ts
 * await db.query.someTable.findMany({
 *   ...getPagination(options),
 * });
 * ```
 */
export const getPagination = (options?: PaginationOptions) => {
  const pagination: PaginationOptions = {};

  if (options?.offset !== undefined) {
    pagination.offset = options.offset;
  }

  if (options?.limit !== undefined) {
    pagination.limit = options.limit;
  }

  return pagination;
};
