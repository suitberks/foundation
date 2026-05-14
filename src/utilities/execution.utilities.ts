/**
 * Safely executes functions and handles errors without using try/catch in the calling code.
 * Example: safeExecute(() => fetchData(), (error) => console.error(error));
 */
export async function safeExecute<T, E = never>(
  fn: () => Promise<T> | T,
  onError?: (error?: unknown) => E | Promise<E>
): Promise<T | E> {
  try {
    return await fn();
  } catch (err) {
    if (onError) return await onError(err);
    // If no error handler is provided, rethrow the error to be handled by the caller or global error handler.
    throw err;
  }
}
