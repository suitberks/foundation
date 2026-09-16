import type { HMACAlgorithm, HMACEncoding } from './hmac.enums';

/**
 * Binary-safe input accepted as either an HMAC payload or a secret key.
 * Strings use UTF-8 encoding while byte arrays preserve their exact contents.
 */
export type HMACInput = string | Uint8Array;

/**
 * Secret material accepted directly or as a previously imported Web Crypto key.
 * Imported keys avoid repeated key imports across high-frequency operations.
 */
export type HMACSecret = HMACInput | CryptoKey;

/**
 * Configures the digest algorithm and textual signature encoding for one service.
 * Omitted values select SHA-256 and lowercase hexadecimal output by default.
 */
export type HMACServiceOptions = Readonly<{
  /**
   * Web Crypto digest algorithm used to authenticate every payload.
   * The service defaults to `SHA-256` when this option is omitted.
   */
  algorithm?: HMACAlgorithm;

  /**
   * Text encoding applied to generated and verified signatures.
   * The service defaults to `hex` when this option is omitted.
   */
  encoding?: HMACEncoding;
}>;
