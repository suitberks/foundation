import { isObject, isString } from '@/guard';

import { DEFAULT_HMAC_ALGORITHM, DEFAULT_HMAC_ENCODING } from './hmac.constants';
import type { HMACAlgorithm, HMACEncoding } from './hmac.enums';
import { hmacErrors } from './hmac.errors';
import type { HMACInput, HMACSecret, HMACServiceOptions } from './hmac.types';
import { decodeHMACSignature, encodeHMACSignature, toHMACBytes } from './hmac.utilities';
import { validateHMACAlgorithm, validateHMACEncoding } from './hmac.validation';

/**
 * Creates and verifies keyed message authentication codes through the Web Crypto API.
 * Each instance preserves its digest algorithm and textual encoding configuration.
 */
export class HMACService {
  public readonly algorithm: HMACAlgorithm;
  public readonly encoding: HMACEncoding;

  constructor(options: HMACServiceOptions = {}) {
    const { algorithm = DEFAULT_HMAC_ALGORITHM, encoding = DEFAULT_HMAC_ENCODING } = options;

    validateHMACAlgorithm(algorithm);
    validateHMACEncoding(encoding);

    this.algorithm = algorithm;
    this.encoding = encoding;
  }

  /**
   * Imports raw secret material as one non-extractable Web Crypto HMAC key.
   * The resulting key supports repeated signing and verification operations.
   */
  public async importKey(secret: HMACInput): Promise<CryptoKey> {
    const secretBytes = toHMACBytes(secret);
    const algorithm = { name: 'HMAC', hash: this.algorithm };
    const keyUsages = ['sign', 'verify'] satisfies Array<'sign' | 'verify'>;

    return crypto.subtle.importKey('raw', secretBytes, algorithm, false, keyUsages);
  }

  /**
   * Authenticates a payload with a secret and returns the encoded signature.
   * Imported keys bypass repeated key creation while preserving service policy.
   *
   * @example
   * const signature = await hmacService.sign('payload', 'shared-secret');
   */
  public async sign(payload: HMACInput, secret: HMACSecret): Promise<string> {
    const key = await this.resolveKey(secret, 'sign');
    const signature = await crypto.subtle.sign('HMAC', key, toHMACBytes(payload));

    return encodeHMACSignature(new Uint8Array(signature), this.encoding);
  }

  /**
   * Verifies an encoded signature without requiring any manual equality comparison.
   * Invalid signatures resolve to `false` while incompatible imported keys reject.
   *
   * @example
   * const verified = await hmacService.verify('payload', signature, 'shared-secret');
   */
  public async verify(payload: HMACInput, signature: string, secret: HMACSecret): Promise<boolean> {
    let signatureBytes: Uint8Array<ArrayBuffer>;

    try {
      signatureBytes = decodeHMACSignature(signature, this.encoding);
    } catch {
      return false;
    }

    const key = await this.resolveKey(secret, 'verify');
    return crypto.subtle.verify('HMAC', key, signatureBytes, toHMACBytes(payload));
  }

  private async resolveKey(secret: HMACSecret, usage: 'sign' | 'verify'): Promise<CryptoKey> {
    const isRawSecret = isString(secret) || secret instanceof Uint8Array;

    if (isRawSecret) {
      return this.importKey(secret);
    }

    // ↓ Recover and validate HMAC metadata omitted by the ambient `KeyAlgorithm` type.

    const hash = Reflect.get(secret.algorithm, 'hash') as unknown;
    const hashName = isObject(hash) && 'name' in hash ? hash.name : undefined;

    const isCompatible =
      secret.type === 'secret' &&
      secret.algorithm.name === 'HMAC' &&
      hashName === this.algorithm &&
      secret.usages.includes(usage);

    if (isCompatible === false) {
      throw hmacErrors.incompatibleCryptoKey();
    }

    return secret;
  }
}
