import type { Base64Alphabet } from './base64.enums';
import { base64Alphabet } from './base64.enums';

/**
 * Default alphabet applied by Base64 utilities when no explicit alphabet is provided.
 * The standard alphabet keeps output compatible with `atob` and MIME transports.
 */
export const DEFAULT_BASE64_ALPHABET = base64Alphabet.BASE64;

/**
 * Canonical padded representations accepted for every supported Base64 alphabet.
 * Complete four-character groups end with at most one correctly padded final group.
 */
export const BASE64_PADDED_PATTERNS = {
  [base64Alphabet.BASE64]: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  [base64Alphabet.BASE64URL]: /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}==|[A-Za-z0-9_-]{3}=)?$/,
} as const satisfies Record<Base64Alphabet, RegExp>;

/**
 * Canonical unpadded representations accepted for every supported Base64 alphabet.
 * Final groups keep two or three characters because one character cannot hold a byte.
 */
export const BASE64_UNPADDED_PATTERNS = {
  [base64Alphabet.BASE64]: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2,3})?$/,
  [base64Alphabet.BASE64URL]: /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/,
} as const satisfies Record<Base64Alphabet, RegExp>;
