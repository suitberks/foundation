import { hmacAlgorithm, hmacEncoding } from './hmac.enums';

/**
 * Default digest algorithm used by `HMACService` when none is configured.
 * SHA-256 provides broad Web Crypto support and a 256-bit authentication tag.
 */
export const DEFAULT_HMAC_ALGORITHM = hmacAlgorithm.SHA_256;

/**
 * Default textual encoding used for every signature returned by `HMACService`.
 * Hex output remains deterministic, portable, and independent of padding rules.
 */
export const DEFAULT_HMAC_ENCODING = hmacEncoding.HEX;
