import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { ZodJWTService } from '@/index';

// =====================================================================================================================
// SHARED JWT SETUP
// =====================================================================================================================

const SECRET = 'correct-horse-battery-staple';
const WRONG_SECRET = 'incorrect-secret';

const payloadSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'member']),
});

const validatedJWT = new ZodJWTService(payloadSchema);
const rawJWT = new ZodJWTService<Record<string, unknown>>();

/**
 * Reads the generated expiration claim without introducing a second JWT implementation.
 * A schema-less public service intentionally returns every claim present in the token payload.
 */
async function readExpiration(token: string): Promise<number | undefined> {
  const payload = await rawJWT.decode(token);
  return typeof payload?.exp === 'number' ? payload.exp : undefined;
}

/**
 * Captures an expected rejection without depending on asynchronous matcher typing.
 * Successful resolution is converted into an explicit and descriptive test failure.
 */
async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error('Expected the promise to reject');
}

// =====================================================================================================================
// JWT SIGNING
// =====================================================================================================================

describe('ZodJWTService.sign', () => {
  test('adds the configured default expiration without mutating the input payload', async () => {
    const service = new ZodJWTService<{ subject: string }>(undefined, { defaultExpirationSeconds: 300 });
    const payload = { subject: 'user-42' };
    const beforeSigning = Math.floor(Date.now() / 1000);

    const token = await service.sign(payload, SECRET);
    const afterSigning = Math.floor(Date.now() / 1000);

    expect(token.split('.')).toHaveLength(3);
    expect(await readExpiration(token)).toBeGreaterThanOrEqual(beforeSigning + 300);
    expect(await readExpiration(token)).toBeLessThanOrEqual(afterSigning + 300);
    expect(payload).toEqual({ subject: 'user-42' });
  });

  test('lets a per-call expiration override the configured default', async () => {
    const service = new ZodJWTService<{ subject: string }>(undefined, { defaultExpirationSeconds: 600 });
    const beforeSigning = Math.floor(Date.now() / 1000);

    const token = await service.sign({ subject: 'user-42' }, SECRET, { expiresInSeconds: 30 });
    const afterSigning = Math.floor(Date.now() / 1000);

    expect(await readExpiration(token)).toBeGreaterThanOrEqual(beforeSigning + 30);
    expect(await readExpiration(token)).toBeLessThanOrEqual(afterSigning + 30);
  });

  test('uses the configured symmetric algorithm for both signing and verification', async () => {
    const hs512JWT = new ZodJWTService(payloadSchema, { algorithm: 'HS512' });
    const token = await hs512JWT.sign({ userId: '42', role: 'admin' }, SECRET);

    expect(await hs512JWT.verifyOrThrow(token, SECRET)).toEqual({ userId: '42', role: 'admin' });
    expect(await captureRejection(validatedJWT.verifyOrThrow(token, SECRET))).toBeInstanceOf(Error);
  });
});

// =====================================================================================================================
// JWT DECODING
// =====================================================================================================================

describe('ZodJWTService.decode', () => {
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
    const allowedUserSchema = payloadSchema.refine(
      async ({ userId }) => {
        await Promise.resolve();
        return userId !== 'blocked';
      },
      {
        message: 'Blocked users cannot use this token.',
      }
    );
    const service = new ZodJWTService(allowedUserSchema);
    const token = await rawJWT.sign({ userId: 'blocked', role: 'member' }, SECRET);

    expect(await service.decode(token)).toBeNull();
  });

  test('rejects when the token itself cannot be decoded', async () => {
    const rejection = await captureRejection(validatedJWT.decode('not-a-jwt'));

    expect(rejection).toBeInstanceOf(Error);
    expect((rejection as Error).message).toContain('invalid JWT token');
  });
});

// =====================================================================================================================
// JWT VERIFICATION
// =====================================================================================================================

describe('ZodJWTService.verifyOrThrow', () => {
  test('verifies the signature and returns the schema-parsed payload', async () => {
    const token = await validatedJWT.sign({ userId: '42', role: 'admin' }, SECRET);

    expect(await validatedJWT.verifyOrThrow(token, SECRET)).toEqual({ userId: '42', role: 'admin' });
  });

  test('rejects a valid token signed with a different secret', async () => {
    const token = await validatedJWT.sign({ userId: '42', role: 'admin' }, SECRET);

    const rejection = await captureRejection(validatedJWT.verifyOrThrow(token, WRONG_SECRET));

    expect(rejection).toBeInstanceOf(Error);
    expect((rejection as Error).message).toContain('signature mismatched');
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
