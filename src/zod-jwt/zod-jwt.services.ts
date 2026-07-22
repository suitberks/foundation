import { decode as decodeJWT, sign as signJWT, verify as verifyJWT } from 'hono/jwt';
import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';

import type { JWTServiceOptions, JWTSignOptions, Payload, PayloadSchema } from './zod-jwt.types';

/**
 * Signs, decodes, and verifies JWTs with optional Zod payload validation.
 * A supplied schema parses payloads returned by decoding and verification.
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
   * Signs a payload using the configured algorithm and expiration settings.
   * Per-call expiration overrides the default configured by the service.
   *
   * @example
   * const token = await jwtService.sign({ userId: '123' }, secret, { expiresInSeconds: 300 });
   */
  public async sign(payload: Payload<TPayloadOrSchema>, secret: string, options?: JWTSignOptions): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + (options?.expiresInSeconds ?? this.defaultExpirationSeconds);

    return signJWT({ ...payload, exp }, secret, this.algorithm);
  }

  /**
   * Decodes without authenticating it and parses its payload when a schema exists.
   * Schema validation failures return `null`, while malformed tokens still reject.
   *
   * @example
   * const payload = await jwtService.decode(token);
   */
  public async decode(token: string): Promise<Payload<TPayloadOrSchema> | null> {
    const { payload } = decodeJWT(token);

    if (this.payloadSchema === undefined) {
      return payload as Payload<TPayloadOrSchema>;
    }

    const { success, data } = await this.payloadSchema.safeParseAsync(payload);
    return success ? (data as Payload<TPayloadOrSchema>) : null;
  }

  /**
   * Verifies a token using the configured algorithm and parses its payload.
   * Signature, expiration, and schema validation failures reject the operation.
   *
   * @example
   * const payload = await jwtService.verifyOrThrow(token, secret);
   */
  public async verifyOrThrow(token: string, secret: string): Promise<Payload<TPayloadOrSchema>> {
    const payload = await verifyJWT(token, secret, this.algorithm);

    if (this.payloadSchema === undefined) {
      return payload as Payload<TPayloadOrSchema>;
    }

    return this.payloadSchema.parseAsync(payload) as Promise<Payload<TPayloadOrSchema>>;
  }
}
