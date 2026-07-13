import type z from 'zod';

import type { zodBulkSelectionSchema } from './zod-bulk.schemas';

/**
 * Shared bulk-selection payload produced by `zodBulkSelectionSchema`.
 * String identifiers are used by default for frontend table integrations.
 */
export type ZodBulkSelection<TIdentifier extends string | number = string> = z.infer<
  ReturnType<typeof zodBulkSelectionSchema<z.ZodType<TIdentifier>>>
>;

/**
 * Explicit bulk selection containing only identifiers chosen by the client.
 * This branch does not require resolving an all-matching search snapshot.
 */
export type ZodBulkIncludeSelection<TIdentifier extends string | number = string> = Extract<
  ZodBulkSelection<TIdentifier>,
  { mode: 'include' }
>;

/**
 * All-matching bulk selection containing identifiers excluded by the client.
 * Backend handlers must resolve targets from the same search snapshot.
 */
export type ZodBulkExcludeSelection<TIdentifier extends string | number = string> = Extract<
  ZodBulkSelection<TIdentifier>,
  { mode: 'exclude' }
>;
