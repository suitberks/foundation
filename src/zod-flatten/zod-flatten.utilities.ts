import z from 'zod';

import type { AnyZodObject } from './zod-flatten.types';

/**
 * Checks if the provided schema is an instance of `z.ZodObject`.
 * @returns `true` if the schema is a `z.ZodObject`, `false` otherwise.
 */
export const isZodObject = (schema: z.ZodTypeAny): schema is AnyZodObject => {
  return schema instanceof z.ZodObject;
};

/**
 * Checks if the provided schema is an instance of `z.ZodOptional`.
 * @returns `true` if the schema is a `z.ZodOptional`, `false` otherwise.
 */
export const isZodOptional = (schema: z.ZodTypeAny): schema is z.ZodOptional<z.ZodTypeAny> => {
  return schema instanceof z.ZodOptional;
};

/**
 * Unwraps a `z.ZodOptional` schema to retrieve its inner schema.
 * If the provided schema is not optional, it is returned unchanged.
 */
export const unwrapOptional = (schema: z.ZodTypeAny): z.ZodTypeAny => {
  return isZodOptional(schema) ? schema.unwrap() : schema;
};
