import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';
import type { JWTPayload } from 'hono/utils/jwt/types';
import type { z } from 'zod';

export type { JWTPayload };

/**
 * Configures the algorithm and default expiration used by `JWTService`.
 * Omitted values use `HS256` and fifteen minutes; negative ones expire.
 */
export type JWTServiceOptions = {
  algorithm?: SymmetricAlgorithm;
  defaultExpirationSeconds?: number;
};

/**
 * Configures one JWT signing operation without changing service defaults.
 * A supplied expiration takes precedence over `defaultExpirationSeconds`.
 */
export type JWTSignOptions = {
  expiresInSeconds?: number;
};

/**
 * Parses an untrusted JWT payload into the payload returned by `JWTService`.
 * Zod transformations and asynchronous refinements remain part of the contract.
 */
export type JWTPayloadSchema<TPayload extends JWTPayload> = z.ZodType<TPayload>;
