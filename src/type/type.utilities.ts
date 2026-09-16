/**
 * Flattens an intersection or mapped type into one readable object shape.
 * Property modifiers remain unchanged while editor output becomes easier to inspect.
 */
export type Simplify<TValue> = { [TKey in keyof TValue]: TValue[TKey] } & {};
