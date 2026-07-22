const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Creates a cryptographically sourced string from the alphanumeric set.
 * Requested length defaults to `10` characters when omitted.
 *
 * @example
 * generateRandomString(5); // `aZ3fG`
 * generateRandomString(); // `G5kLm2P9sQ`
 */
export function generateRandomString(length: number = 10): string {
  const randomValues = crypto.getRandomValues(new Uint32Array(length));

  let result = '';
  for (let i = 0; i < length; i++) {
    result += DEFAULT_CHARACTERS[randomValues[i]! % DEFAULT_CHARACTERS.length];
  }

  return result;
}
