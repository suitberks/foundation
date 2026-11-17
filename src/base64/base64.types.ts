import type { Base64Alphabet } from './base64.enums';

/**
 * Options selecting one canonical Base64 representation for encoding and decoding.
 * Omitted values select padded standard output, and decoding mirrors encoding.
 */
export type Base64Options = Readonly<{
  alphabet?: Base64Alphabet;
  omitPadding?: boolean;
}>;
