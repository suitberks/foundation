import { describe, expect, test } from 'bun:test';

import {
  DEFAULT_HMAC_ALGORITHM,
  DEFAULT_HMAC_ENCODING,
  type HMACAlgorithm,
  type HMACEncoding,
  type HMACErrorCode,
  type HMACInput,
  type HMACSecret,
  HMACService,
  decodeHMACSignature,
  encodeHMACSignature,
  hmacAlgorithm,
  hmacAlgorithmsArray,
  hmacEncoding,
  hmacEncodingsArray,
  hmacErrors,
  toHMACBytes,
} from '@/index';

// These tests cover HMAC catalogs, encoding, key reuse, signing, and verification behavior.
// They preserve exact public types and stable failures across raw and imported secret material.

// == CompileTimeContracts ==============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _HMACAlgorithmContract = Assert<IsExact<HMACAlgorithm, 'SHA-256' | 'SHA-384' | 'SHA-512'>>;
type _HMACEncodingContract = Assert<IsExact<HMACEncoding, 'hex' | 'base64' | 'base64url'>>;
type _HMACInputContract = Assert<IsExact<HMACInput, string | Uint8Array>>;
type _HMACSecretContract = Assert<IsExact<HMACSecret, string | Uint8Array | CryptoKey>>;
type _HMACErrorCodeContract = Assert<
  IsExact<
    HMACErrorCode,
    'invalidHexSignature' | 'invalidBase64Signature' | 'invalidBase64UrlSignature' | 'incompatibleCryptoKey'
  >
>;

// == HMACCatalogs ======================================================

describe('HMAC catalogs', () => {
  test('keeps literal collections, aliases, and defaults synchronized', () => {
    expect(hmacAlgorithmsArray).toEqual(['SHA-256', 'SHA-384', 'SHA-512']);
    expect(hmacEncodingsArray).toEqual(['hex', 'base64', 'base64url']);
    expect(hmacAlgorithm.SHA_256).toBe('SHA-256');
    expect(hmacEncoding.BASE64URL).toBe('base64url');
    expect(DEFAULT_HMAC_ALGORITHM).toBe(hmacAlgorithm.SHA_256);
    expect(DEFAULT_HMAC_ENCODING).toBe(hmacEncoding.HEX);
  });
});

// == HMACErrors ========================================================

describe('HMAC errors', () => {
  test('creates typed failures with stable camelCase codes', () => {
    const invalidHexError = hmacErrors.invalidHexSignature();
    const invalidBase64Error = hmacErrors.invalidBase64Signature();
    const invalidBase64UrlError = hmacErrors.invalidBase64UrlSignature();
    const incompatibleKeyError = hmacErrors.incompatibleCryptoKey();

    expect(invalidHexError).toBeInstanceOf(TypeError);
    expect(invalidHexError.message).toBe('invalidHexSignature');
    expect(invalidBase64Error.message).toBe('invalidBase64Signature');
    expect(invalidBase64UrlError.message).toBe('invalidBase64UrlSignature');
    expect(incompatibleKeyError.message).toBe('incompatibleCryptoKey');
  });
});

// == SignatureEncoding ================================================

describe('HMAC encoding utilities', () => {
  test('encodes strings as UTF-8 and copies supplied byte arrays', () => {
    const source = new Uint8Array([0, 127, 128, 255]);
    const copied = toHMACBytes(source);

    expect(toHMACBytes('Foundation')).toEqual(new TextEncoder().encode('Foundation'));
    expect(copied).toEqual(source);
    expect(copied).not.toBe(source);
  });

  test.each(hmacEncodingsArray.map((encoding) => [encoding] as const))(
    'round-trips arbitrary bytes through %s',
    (encoding) => {
      const source = new Uint8Array([0, 1, 127, 128, 254, 255]);
      const encoded = encodeHMACSignature(source, encoding);

      expect(decodeHMACSignature(encoded, encoding)).toEqual(source);
    }
  );

  test('rejects malformed signatures before cryptographic verification', () => {
    expect(() => decodeHMACSignature('abc', hmacEncoding.HEX)).toThrow('invalidHexSignature');
    expect(() => decodeHMACSignature('not base64', hmacEncoding.BASE64)).toThrow('invalidBase64Signature');
    expect(() => decodeHMACSignature('a', hmacEncoding.BASE64URL)).toThrow('invalidBase64UrlSignature');
  });
});

// == HMACService =======================================================

describe('HMACService', () => {
  test('uses SHA-256 and hexadecimal signatures by default', () => {
    const service = new HMACService();

    expect(service.algorithm).toBe(hmacAlgorithm.SHA_256);
    expect(service.encoding).toBe(hmacEncoding.HEX);
  });

  test('matches the RFC 4231 SHA-256 test vector', async () => {
    const service = new HMACService();
    const secret = new Uint8Array(20).fill(0x0b);

    expect(await service.sign('Hi There', secret)).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7'
    );
  });

  test('imports one non-extractable key for repeated signing and verification', async () => {
    const service = new HMACService();
    const key = await service.importKey('shared-secret');
    const signature = await service.sign('payload', key);

    expect(key.type).toBe('secret');
    expect(key.extractable).toBe(false);
    expect(key.usages).toEqual(['sign', 'verify']);
    expect(key.algorithm.name).toBe('HMAC');
    expect(await service.verify('payload', signature, key)).toBe(true);
  });

  test('rejects imported keys that violate the configured algorithm policy', async () => {
    const sha256Service = new HMACService();
    const sha384Service = new HMACService({ algorithm: hmacAlgorithm.SHA_384 });
    const sha256Key = await sha256Service.importKey('shared-secret');

    expect(sha384Service.sign('payload', sha256Key)).rejects.toThrow('incompatibleCryptoKey');
  });

  test('rejects imported keys that do not permit the requested operation', async () => {
    const service = new HMACService();
    const signOnlyKey = await crypto.subtle.importKey(
      'raw',
      toHMACBytes('shared-secret'),
      { name: 'HMAC', hash: hmacAlgorithm.SHA_256 },
      false,
      ['sign']
    );
    const signature = await service.sign('payload', signOnlyKey);

    expect(service.verify('payload', signature, signOnlyKey)).rejects.toThrow('incompatibleCryptoKey');
  });

  test.each([
    [hmacAlgorithm.SHA_384, 96],
    [hmacAlgorithm.SHA_512, 128],
  ] as const)('supports %s with its complete hexadecimal output', async (algorithm, length) => {
    const service = new HMACService({ algorithm });
    const signature = await service.sign('payload', 'shared-secret');

    expect(signature).toHaveLength(length);
    expect(signature).toMatch(/^[0-9a-f]+$/);
  });

  test.each([hmacEncoding.BASE64, hmacEncoding.BASE64URL] as const)(
    'round-trips signatures using %s encoding',
    async (encoding) => {
      const service = new HMACService({ encoding });
      const signature = await service.sign('payload', 'shared-secret');

      expect(await service.verify('payload', signature, 'shared-secret')).toBe(true);
    }
  );

  test('rejects altered payloads, incorrect secrets, and malformed signatures', async () => {
    const service = new HMACService();
    const signature = await service.sign('payload', 'shared-secret');

    expect(await service.verify('altered', signature, 'shared-secret')).toBe(false);
    expect(await service.verify('payload', signature, 'incorrect-secret')).toBe(false);
    expect(await service.verify('payload', 'not-a-signature', 'shared-secret')).toBe(false);
  });
});
