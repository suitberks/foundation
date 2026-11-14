import type { Base64Alphabet } from './base64.enums';

/**
 * Options selecting one canonical Base64 representation for encoding and decoding.
 * Sharing them guarantees that decoding accepts exactly what encoding produces.
 */
export type Base64Options = Readonly<{
  /**
   * Character alphabet used for the two final Base64 index positions.
   * The standard `base64` alphabet applies when this option is omitted.
   */
  alphabet?: Base64Alphabet;

  /**
   * Omits trailing `=` padding on output and forbids it on input when enabled.
   * Padded canonical representations remain the default when it is omitted.
   */
  omitPadding?: boolean;
}>;
