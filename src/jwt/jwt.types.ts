import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';
import type { JWTPayload } from 'hono/utils/jwt/types';
import type { z } from 'zod';

/**
 * Configures the algorithm and default expiration used by `JWTService`.
 * Omitted values fall back to `HS256` and fifteen minutes respectively.
 */
export type JWTServiceOptions = {
  /**
   * Symmetric algorithm used to sign and verify every token handled by the service.
   * Defaults to `HS256` when the configuration does not provide another value.
   */
  algorithm?: SymmetricAlgorithm;

  /**
   * Default lifetime assigned to signed tokens, expressed in whole seconds.
   * Negative values intentionally create tokens that are already expired.
   */
  defaultExpirationSeconds?: number;
};

/**
 * Configures one JWT signing operation without changing service defaults.
 * A supplied expiration takes precedence over `defaultExpirationSeconds`.
 */
export type JWTSignOptions = {
  /**
   * Lifetime assigned to the token created by this signing operation.
   * The value overrides the service default and uses whole seconds.
   */
  expiresInSeconds?: number;
};

/**
 * Parses an untrusted JWT payload into the payload returned by `JWTService`.
 * Zod transformations and asynchronous refinements remain part of the contract.
 */
export type JWTPayloadSchema<TPayload extends JWTPayload> = z.ZodType<TPayload>;

export type { JWTPayload };
