import { decode as decodeJWT, sign as signJWT, verify as verifyJWT } from 'hono/jwt';
import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';

import type { JWTServiceOptions, JWTSignOptions, Payload, PayloadSchema } from './zod-jwt.types';

/**
 * A service class for handling JWT operations with optional Zod schema validation for the payload.
 * The class is generic, allowing you to specify the type of the payload or a schema for validation.
 */
export class ZodJWTService<TPayloadOrSchema> {
  public readonly payloadSchema: PayloadSchema<TPayloadOrSchema> | undefined;

  protected readonly algorithm: SymmetricAlgorithm;
  protected readonly defaultExpirationSeconds: number;

  constructor(payloadSchema?: PayloadSchema<TPayloadOrSchema>, options?: JWTServiceOptions) {
    this.payloadSchema = payloadSchema;

    this.algorithm = options?.algorithm ?? 'HS256';
    this.defaultExpirationSeconds = options?.defaultExpirationSeconds ?? 60 * 15;
  }

  /**
   * Signs a JWT token with the provided payload and secret, using the configured algorithm and expiration settings.
   * Example usage: `const accessToken = await JWTServiceInstance.sign({ userId: 123 }, 'my-secret', { expiresInSeconds: 300 });`
   */
  public async sign(payload: Payload<TPayloadOrSchema>, secret: string, options?: JWTSignOptions): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + (options?.expiresInSeconds ?? this.defaultExpirationSeconds);

    return signJWT({ ...payload, exp }, secret, this.algorithm);
  }

  /**
   * Decodes a JWT token, and if a Zod schema is provided, validates the payload against it.
   * Returns the decoded payload if valid, or null if invalid or if the token cannot be decoded.
   * Example usage: `const payload = await JWTServiceInstance.decode(token);`
   */
  public async decode(token: string): Promise<Payload<TPayloadOrSchema> | null> {
    const { payload } = decodeJWT(token);

    if (!this.payloadSchema) {
      return payload as Payload<TPayloadOrSchema>;
    }

    const { success, data } = await this.payloadSchema.safeParseAsync(payload);
    return success ? (data as Payload<TPayloadOrSchema>) : null;
  }

  /**
   * Verifies and decodes a JWT token using the provided secret and configured algorithm,
   * then validates the payload against the Zod schema if one is provided. Throws an error if verification fails or if the payload is invalid.
   * Example usage: `const payload = await JWTServiceInstance.verifyOrThrow(token, 'my-secret');`
   */
  public async verifyOrThrow(token: string, secret: string): Promise<Payload<TPayloadOrSchema>> {
    const payload = await verifyJWT(token, secret, this.algorithm);

    if (!this.payloadSchema) {
      return payload as Payload<TPayloadOrSchema>;
    }

    return this.payloadSchema.parseAsync(payload) as Promise<Payload<TPayloadOrSchema>>;
  }
}
