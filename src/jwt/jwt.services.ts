import { decode as decodeJWT, sign as signJWT, verify as verifyJWT } from 'hono/jwt';
import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';
import type { JWTPayload } from 'hono/utils/jwt/types';

import { DEFAULT_JWT_ALGORITHM, DEFAULT_JWT_EXPIRATION_SECONDS } from './jwt.constants';
import type { JWTPayloadSchema, JWTServiceOptions, JWTSignOptions } from './jwt.types';
import { validateJWTExpirationSeconds } from './jwt.validation';

/**
 * Signs, decodes, and verifies JWTs with optional payload schema validation.
 * A supplied schema parses payloads returned by decoding and verification.
 */
export class JWTService<TPayload extends JWTPayload = JWTPayload> {
  public readonly payloadSchema: JWTPayloadSchema<TPayload> | undefined;

  protected readonly algorithm: SymmetricAlgorithm;
  protected readonly defaultExpirationSeconds: number;

  constructor(payloadSchema?: JWTPayloadSchema<TPayload>, options: JWTServiceOptions = {}) {
    const { algorithm = DEFAULT_JWT_ALGORITHM, defaultExpirationSeconds = DEFAULT_JWT_EXPIRATION_SECONDS } = options;

    validateJWTExpirationSeconds(defaultExpirationSeconds);

    this.payloadSchema = payloadSchema;
    this.algorithm = algorithm;
    this.defaultExpirationSeconds = defaultExpirationSeconds;
  }

  /**
   * Signs a payload using the configured algorithm and expiration settings.
   * Per-operation expiration overrides the default configured by the service.
   *
   * @example
   * const token = await jwtService.sign({ userId: '123' }, secret, { expiresInSeconds: 300 });
   */
  public async sign(payload: TPayload, secret: string, options: JWTSignOptions = {}): Promise<string> {
    const { expiresInSeconds = this.defaultExpirationSeconds } = options;

    validateJWTExpirationSeconds(expiresInSeconds);

    const expirationTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;

    return signJWT({ ...payload, exp: expirationTimestamp }, secret, this.algorithm);
  }

  /**
   * Decodes a token without authentication and parses its payload when configured.
   * Schema failures return `null`, while malformed token failures remain unchanged.
   *
   * @example
   * const payload = await jwtService.decode(token);
   */
  public async decode(token: string): Promise<TPayload | null> {
    const { payload } = decodeJWT(token);

    if (this.payloadSchema === undefined) {
      // Hono returns the base payload represented by the service's default generic.
      return payload as TPayload;
    }

    const result = await this.payloadSchema.safeParseAsync(payload);
    return result.success ? result.data : null;
  }

  /**
   * Verifies a token using the configured algorithm and parses its payload.
   * Authentication, expiration, and schema failures reject the operation.
   *
   * @example
   * const payload = await jwtService.verifyOrThrow(token, secret);
   */
  public async verifyOrThrow(token: string, secret: string): Promise<TPayload> {
    const payload = await verifyJWT(token, secret, this.algorithm);

    if (this.payloadSchema === undefined) {
      // Hono returns the base payload represented by the service's default generic.
      return payload as TPayload;
    }

    return this.payloadSchema.parseAsync(payload);
  }
}
