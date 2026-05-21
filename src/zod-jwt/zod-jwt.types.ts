import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';
import type z from 'zod';

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

/** Utility types for inferring payload types from Zod schemas. */
export type Payload<T> = T extends z.ZodType ? z.infer<T> : T;

/** Utility type to extract the payload schema type from a Zod schema. */
export type PayloadSchema<T> = T extends z.ZodType ? T : never;
