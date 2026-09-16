/**
 * Flattens an intersection or mapped type into one readable object shape.
 * Property modifiers remain unchanged while editor output becomes easier to inspect.
 *
 * @example
 * type User = Simplify<{ id: string } & { email: string }>;
 */
export type Simplify<TValue> = { [TKey in keyof TValue]: TValue[TKey] } & {};

/**
 * Builds a union whose branches retain one selected property and forbid every other selected key.
 * Each flattened branch preserves the selected property's original value type and optionality.
 *
 * @example
 * type UserSelector = ExactlyOne<{ id: string; email: string }, 'id' | 'email'>;
 */
export type ExactlyOne<TEntity, TKeys extends keyof TEntity> = {
  [TKey in TKeys]: Simplify<Pick<TEntity, TKey> & Partial<Record<Exclude<TKeys, TKey>, never>>>;
}[TKeys];
