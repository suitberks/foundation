import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';
import type z from 'zod';

/**
 * Configures the algorithm and default expiration used by `ZodJWTService`.
 * Omitted values fall back to `HS256` and fifteen minutes respectively.
 */
export type JWTServiceOptions = {
  /**
   * Symmetric algorithm used to sign and verify every token handled by the service.
   * Defaults to `HS256` when the configuration does not provide another value.
   */
  algorithm?: SymmetricAlgorithm;
  /**
   * Default lifetime assigned to signed tokens, expressed in seconds.
   * Defaults to `900` seconds, which is equivalent to fifteen minutes.
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
   * Overrides the service default and remains expressed in seconds.
   */
  expiresInSeconds?: number;
};

/**
 * Resolves the parsed payload of a Zod schema or preserves a direct payload type.
 * Schema transforms are reflected in the resulting inferred payload.
 */
export type Payload<T> = T extends z.ZodType ? z.infer<T> : T;

/**
 * Preserves a Zod payload schema and rejects direct payload types with `never`.
 * The result controls whether runtime payload validation is available.
 */
export type PayloadSchema<T> = T extends z.ZodType ? T : never;
