import type { Simplify } from '@/type';

// Values with no traversable payload structure are serialized directly to strings;
// `Date` is included explicitly because its object shape must not become mapped fields;

type StringifiablePayloadValue = string | number | boolean | bigint | Date;

/**
 * Recursively transforms payload values to strings while preserving container structure.
 * Nullable and omitted members remain unchanged for transport-layer omission handling.
 */
export type StringifiedPayload<TValue> = TValue extends null | undefined
  ? TValue
  : TValue extends StringifiablePayloadValue
    ? string
    : TValue extends readonly (infer TItem)[]
      ? StringifiedPayload<TItem>[]
      : TValue extends object
        ? { [TKey in keyof TValue]: StringifiedPayload<TValue[TKey]> }
        : string;

/**
 * Utility type that ensures at least one property from the specified
 * keys of a given type T is required, while the rest remain optional.
 *
 * This is useful for scenarios where you want to enforce that at least one
 * of several optional (nullable) properties must be provided in an object.
 *
 * @example
 * type Example = AtLeastOne<{ a?: string; b?: number; c?: boolean }>;
 * // Valid: { a: "hello" }, { b: 42 }, { c: true }, { a: "hello", b: 42 }
 * // Invalid: {}, { a: undefined, b: undefined, c: undefined }
 */
export type AtLeastOne<T, Keys extends keyof T = keyof T> = Keys extends keyof T
  ? Simplify<Required<Pick<T, Keys>> & Partial<Omit<T, Keys>>>
  : never;
