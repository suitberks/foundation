import { jwtErrors } from './jwt.errors';

/**
 * Validates a JWT lifetime before it participates in expiration calculation.
 * Whole positive, zero, and negative seconds are accepted within the safe range.
 */
export function validateJWTExpirationSeconds(expirationSeconds: number): void {
  const hasSafeWholeSeconds = Number.isSafeInteger(expirationSeconds);

  if (hasSafeWholeSeconds === false) {
    throw jwtErrors.invalidExpirationSeconds();
  }
}
