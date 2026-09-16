import type { SymmetricAlgorithm } from 'hono/utils/jwt/jwa';

/**
 * Default symmetric algorithm applied to JWT signing and verification operations.
 * The policy uses `HS256` unless a service instance explicitly selects another value.
 */
export const DEFAULT_JWT_ALGORITHM: SymmetricAlgorithm = 'HS256';

/**
 * Default token lifetime applied when a signing operation supplies no override.
 * The duration is expressed in seconds and represents exactly fifteen minutes.
 */
export const DEFAULT_JWT_EXPIRATION_SECONDS = 15 * 60;
