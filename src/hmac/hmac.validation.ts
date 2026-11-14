import { hmacAlgorithmsArray, hmacEncodingsArray } from './hmac.enums';
import type { HMACAlgorithm, HMACEncoding } from './hmac.enums';
import { hmacErrors } from './hmac.errors';

/**
 * Validates one HMAC digest algorithm before it reaches Web Crypto operations.
 * Only members of `hmacAlgorithmsArray` are accepted across runtime boundaries.
 */
export function validateHMACAlgorithm(algorithm: HMACAlgorithm): void {
  const isSupportedAlgorithm = hmacAlgorithmsArray.some((value) => value === algorithm);

  if (isSupportedAlgorithm === false) {
    throw hmacErrors.invalidSignatureAlgorithm();
  }
}

/**
 * Validates one signature text encoding before signatures are encoded or decoded.
 * Only members of `hmacEncodingsArray` are accepted across runtime boundaries.
 */
export function validateHMACEncoding(encoding: HMACEncoding): void {
  const isSupportedEncoding = hmacEncodingsArray.some((value) => value === encoding);

  if (isSupportedEncoding === false) {
    throw hmacErrors.invalidSignatureEncoding();
  }
}
