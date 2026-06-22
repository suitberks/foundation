import type z from 'zod';

// Generic Zod shape: a record mapping string keys to any Zod type.
export type ZodShape = Record<string, z.ZodTypeAny>;

// Zod object with a generic shape, used for nested object detection.
export type AnyZodObject = z.ZodObject<ZodShape>;

// Converts a union type into an intersection type, used to merge flattened field records.
type UnionToIntersection<T> = (T extends unknown ? (value: T) => void : never) extends (value: infer I) => void
  ? I
  : never;

// Unwraps a ZodOptional wrapper, returning the inner schema. Returns T unchanged if not optional.
type UnwrapOptional<T extends z.ZodTypeAny> = T extends z.ZodOptional<infer Inner> ? Inner : T;

// Resolves to `true` if T is a ZodOptional, `false` otherwise.
type IsOptional<T extends z.ZodTypeAny> = T extends z.ZodOptional<z.ZodTypeAny> ? true : false;

// Wraps TSchema in ZodOptional when TShouldOptionalize is `true`; returns TSchema as-is otherwise.
type Optionalize<TSchema extends z.ZodTypeAny, TShouldOptionalize extends boolean> = TShouldOptionalize extends true
  ? z.ZodOptional<TSchema>
  : TSchema;

// Extracts the inner keys of a nested ZodObject field, preserving the parent's optionality on each promoted key.
type FlattenObjectField<TSchema extends z.ZodTypeAny> =
  UnwrapOptional<TSchema> extends z.ZodObject<infer InnerShape extends ZodShape>
    ? { [K in keyof InnerShape]: Optionalize<InnerShape[K], IsOptional<TSchema>> }
    : never;

// Maps each shape key to its flattened nested fields, producing a union of flat records.
type FlattenNestedObjectFields<TShape extends ZodShape> = {
  [K in keyof TShape]: FlattenObjectField<TShape[K]>;
}[keyof TShape];

/**
 * The resulting shape after all nested `z.ZodObject` fields have been lifted to the top level.
 * Primitive fields are kept as-is; nested object fields are replaced with their inner keys.
 * If the parent field was optional, all promoted inner fields become optional as well.
 */
export type FlattenZodShape<TShape extends ZodShape> = {
  [K in keyof TShape as UnwrapOptional<TShape[K]> extends AnyZodObject ? never : K]: TShape[K];
} & UnionToIntersection<FlattenNestedObjectFields<TShape>>;
