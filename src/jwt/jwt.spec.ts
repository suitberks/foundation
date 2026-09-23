import { describe, expect, test } from 'bun:test';

import { z } from 'zod';

import {
  DEFAULT_JWT_ALGORITHM,
  DEFAULT_JWT_EXPIRATION_SECONDS,
  JWTService,
  jwtErrors,
  validateJWTExpirationSeconds,
} from '@/index';
import type { JWTErrorCode, JWTPayload, JWTPayloadSchema, JWTServiceOptions, JWTSignOptions } from '@/index';

// These tests describe the public behavior covered by the JWT module specification.
// They preserve exact types and observable semantics across supported operations.

const SECRET = 'correct-horse-battery-staple';
const WRONG_SECRET = 'incorrect-secret';

const payloadSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'member']),
});

type Payload = z.infer<typeof payloadSchema>;

const validatedJWT = new JWTService(payloadSchema);
const rawJWT = new JWTService();

async function readExpiration(token: string): Promise<number | undefined> {
  const payload = await rawJWT.decode(token);
  return typeof payload?.exp === 'number' ? payload.exp : undefined;
}

async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  return expect.unreachable();
}

// == CompileTimeContracts ==============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2 ? true : false;
type Assert<TCondition extends true> = TCondition;

type _PayloadSchemaContract = Assert<IsExact<JWTPayloadSchema<Payload>, z.ZodType<Payload>>>;
type _ServiceOptionsContract = Assert<
  IsExact<JWTServiceOptions, { algorithm?: 'HS256' | 'HS384' | 'HS512'; defaultExpirationSeconds?: number }>
>;
type _SignOptionsContract = Assert<IsExact<JWTSignOptions, { expiresInSeconds?: number }>>;
type _ErrorCodeContract = Assert<IsExact<JWTErrorCode, 'invalidExpirationSeconds'>>;
type _BasePayloadContract = Assert<IsExact<JWTPayload['exp'], number | undefined>>;

function assertRejectedPublicShapes(): void {
  // @ts-expect-error JWT payloads must remain object-shaped.
  const invalidPayloadService = new JWTService<string>();

  // @ts-expect-error Asymmetric algorithms are outside this service contract.
  const asymmetricAlgorithmService = new JWTService(undefined, { algorithm: 'RS256' });

  void invalidPayloadService;
  void asymmetricAlgorithmService;
}

void assertRejectedPublicShapes;

// == DefaultsAndValidation =============================================

describe('JWT defaults and validation', () => {
  test('exposes stable signing defaults', () => {
    expect(DEFAULT_JWT_ALGORITHM).toBe('HS256');
    expect(DEFAULT_JWT_EXPIRATION_SECONDS).toBe(900);
  });

  test('accepts positive, zero, and negative whole-second lifetimes', () => {
    expect(() => validateJWTExpirationSeconds(300)).not.toThrow();
    expect(() => validateJWTExpirationSeconds(0)).not.toThrow();
    expect(() => validateJWTExpirationSeconds(-1)).not.toThrow();
  });

  test('rejects fractional and unsafe lifetimes with a stable error code', () => {
    expect(() => validateJWTExpirationSeconds(0.5)).toThrow(jwtErrors.invalidExpirationSeconds());
    expect(() => validateJWTExpirationSeconds(Number.POSITIVE_INFINITY)).toThrow(jwtErrors.invalidExpirationSeconds());
  });

  test('validates configured and per-operation lifetimes before signing', async () => {
    expect(() => new JWTService(undefined, { defaultExpirationSeconds: Number.NaN })).toThrow(
      jwtErrors.invalidExpirationSeconds()
    );

    expect(await captureRejection(rawJWT.sign({}, SECRET, { expiresInSeconds: 0.5 }))).toEqual(
      jwtErrors.invalidExpirationSeconds()
    );
  });
});

// == Signing ===========================================================

describe('JWTService.sign', () => {
  test('adds the configured default expiration without mutating the input payload', async () => {
    const service = new JWTService<{ subject: string }>(undefined, { defaultExpirationSeconds: 300 });
    const payload = { subject: 'user-42' };
    const beforeSigning = Math.floor(Date.now() / 1000);

    const token = await service.sign(payload, SECRET);
    const afterSigning = Math.floor(Date.now() / 1000);

    expect(token.split('.')).toHaveLength(3);
    expect(await readExpiration(token)).toBeGreaterThanOrEqual(beforeSigning + 300);
    expect(await readExpiration(token)).toBeLessThanOrEqual(afterSigning + 300);
    expect(payload).toEqual({ subject: 'user-42' });
  });

  test('lets a per-operation expiration override the configured default', async () => {
    const service = new JWTService<{ subject: string }>(undefined, { defaultExpirationSeconds: 600 });
    const beforeSigning = Math.floor(Date.now() / 1000);

    const token = await service.sign({ subject: 'user-42' }, SECRET, { expiresInSeconds: 30 });
    const afterSigning = Math.floor(Date.now() / 1000);

    expect(await readExpiration(token)).toBeGreaterThanOrEqual(beforeSigning + 30);
    expect(await readExpiration(token)).toBeLessThanOrEqual(afterSigning + 30);
  });

  test('uses the configured symmetric algorithm for signing and verification', async () => {
    const hs512JWT = new JWTService(payloadSchema, { algorithm: 'HS512' });
    const token = await hs512JWT.sign({ userId: '42', role: 'admin' }, SECRET);

    expect(await hs512JWT.verifyOrThrow(token, SECRET)).toEqual({ userId: '42', role: 'admin' });
    expect(await captureRejection(validatedJWT.verifyOrThrow(token, SECRET))).toBeInstanceOf(Error);
  });
});

// == Decoding ==========================================================

describe('JWTService.decode', () => {
  test('returns all claims when no payload schema is configured', async () => {
    const token = await rawJWT.sign({ userId: '42', customClaim: true }, SECRET);
    const decoded = await rawJWT.decode(token);

    expect(decoded).toMatchObject({ userId: '42', customClaim: true });
    expect(decoded?.exp).toBeNumber();
  });

  test('returns the schema-parsed payload and strips unknown claims', async () => {
    const token = await rawJWT.sign({ userId: '42', role: 'member', ignored: 'claim' }, SECRET);

    expect(await validatedJWT.decode(token)).toEqual({ userId: '42', role: 'member' });
  });

  test('returns null when the decoded payload fails asynchronous schema validation', async () => {
    const allowedUserSchema = payloadSchema.refine(async ({ userId }) => {
      await Promise.resolve();
      return userId !== 'blocked';
    });
    const service = new JWTService(allowedUserSchema);
    const token = await rawJWT.sign({ userId: 'blocked', role: 'member' }, SECRET);

    expect(await service.decode(token)).toBeNull();
  });

  test('rejects when the token itself cannot be decoded', async () => {
    expect(await captureRejection(validatedJWT.decode('not-a-jwt'))).toBeInstanceOf(Error);
  });
});

// == Verification ======================================================

describe('JWTService.verifyOrThrow', () => {
  test('verifies the signature and returns the schema-parsed payload', async () => {
    const token = await validatedJWT.sign({ userId: '42', role: 'admin' }, SECRET);

    expect(await validatedJWT.verifyOrThrow(token, SECRET)).toEqual({ userId: '42', role: 'admin' });
  });

  test('rejects a valid token signed with a different secret', async () => {
    const token = await validatedJWT.sign({ userId: '42', role: 'admin' }, SECRET);

    expect(await captureRejection(validatedJWT.verifyOrThrow(token, WRONG_SECRET))).toBeInstanceOf(Error);
  });

  test('rejects an expired token', async () => {
    const token = await validatedJWT.sign({ userId: '42', role: 'admin' }, SECRET, { expiresInSeconds: -1 });

    expect(await captureRejection(validatedJWT.verifyOrThrow(token, SECRET))).toBeInstanceOf(Error);
  });

  test('rejects with a Zod error when an authenticated payload fails schema validation', async () => {
    const token = await rawJWT.sign({ userId: 42, role: 'owner' }, SECRET);

    expect(await captureRejection(validatedJWT.verifyOrThrow(token, SECRET))).toBeInstanceOf(z.ZodError);
  });
});
