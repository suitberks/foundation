/**
 * Alphanumeric character collection used by the default random-string generator.
 * Its fixed ordering keeps byte-to-character translation stable across runtimes.
 */
export const RANDOM_ALPHANUMERIC_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Default output length used when `generateRandomString` receives no override.
 * Ten characters preserve the historical package contract for existing consumers.
 */
export const DEFAULT_RANDOM_STRING_LENGTH = 10;

/**
 * Maximum random-byte count requested from Web Crypto in one operation.
 * The boundary follows the platform limit enforced by `crypto.getRandomValues`.
 */
export const RANDOM_BYTE_BATCH_SIZE = 65_536;
