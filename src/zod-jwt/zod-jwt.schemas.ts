import { decode as decodeJWT, sign as signJWT, verify as verifyJWT } from 'hono/jwt';
import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';
import type z from 'zod';

import type { JWTServiceOptions, JWTSignOptions } from './zod-jwt.types';

export class ZodJWTService<TSchema extends z.ZodObject<z.ZodRawShape>> {
  public readonly payloadSchema: TSchema | undefined;

  protected readonly algorithm: SymmetricAlgorithm;
  protected readonly defaultExpirationSeconds: number;

  constructor(payloadSchema?: TSchema, options?: JWTServiceOptions) {
    this.payloadSchema = payloadSchema;

    this.algorithm = options?.algorithm ?? 'HS256';
    this.defaultExpirationSeconds = options?.defaultExpirationSeconds ?? 60 * 15;
  }

  /**
   * Signs a JWT token with the provided payload and secret, using the configured algorithm and expiration settings.
   * Example usage: `const accessToken = await JWTServiceInstance.sign({ userId: 123 }, 'my-secret', { expiresInSeconds: 300 });`
   */
  public async sign(payload: z.infer<TSchema>, secret: string, options?: JWTSignOptions): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + (options?.expiresInSeconds ?? this.defaultExpirationSeconds);

    return signJWT({ ...payload, exp }, secret, this.algorithm);
  }

  /**
   * Decodes a JWT token, and validates the payload against the Zod schema.
   * Note: This method does NOT verify the token's signature or check for expiration.
   */
  public async decode(token: string): Promise<z.infer<TSchema> | null> {
    const { payload } = decodeJWT(token);

    if (!this.payloadSchema) return payload as z.infer<TSchema>;

    const { success, data } = await this.payloadSchema.safeParseAsync(payload);
    return success ? data : null;
  }

  /**
   * Verifies and decodes a JWT token using the provided secret and configured algorithm,
   * then validates the payload against the Zod schema, also throws on expired tokens.
   */
  public async verifyOrThrow(token: string, secret: string): Promise<z.infer<TSchema>> {
    const payload = await verifyJWT(token, secret, this.algorithm);

    if (!this.payloadSchema) return payload as z.infer<TSchema>;

    return this.payloadSchema.parseAsync(payload);
  }
}
