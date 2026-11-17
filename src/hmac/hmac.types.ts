import type { HMACAlgorithm, HMACEncoding } from './hmac.enums';

/**
 * Binary-safe input accepted as either an HMAC payload or its secret key.
 * Strings use UTF-8 encoding while byte arrays keep their exact contents.
 */
export type HMACInput = string | Uint8Array;

/**
 * Secret material accepted directly or as a previously imported Web Crypto key.
 * Imported keys avoid repeated key imports across high-frequency operations.
 */
export type HMACSecret = HMACInput | CryptoKey;

/**
 * Configures the digest algorithm and signature encoding for one service.
 * Omitted values select SHA-256 and lowercase hexadecimal output by default.
 */
export type HMACServiceOptions = Readonly<{
  algorithm?: HMACAlgorithm;
  encoding?: HMACEncoding;
}>;
