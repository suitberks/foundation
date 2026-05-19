import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';

/** Options for configuring the JWT service. */
export type JWTServiceOptions = {
  /** The algorithm to use for signing and verifying JWTs. Defaults to 'HS256'. */
  algorithm?: SymmetricAlgorithm;
  /** The default number of seconds until a signed JWT expires. Defaults to 900 seconds (15 minutes). */
  defaultExpirationSeconds?: number;
};

/** Options for signing a JWT. */
export type JWTSignOptions = {
  /** The number of seconds until the JWT expires. */
  expiresInSeconds?: number;
};
