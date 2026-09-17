/**
 * Options defining the accepted shape of one canonical decimal string format.
 * Precision and scale are mandatory while sign and zero policies remain optional.
 */
export type DecimalFormatOptions = Readonly<{
  /**
   * Maximum digit count accepted across integer and fractional decimal parts.
   * The value must be a positive safe integer greater than the configured scale.
   */
  precision: number;

  /**
   * Maximum digit count accepted after the decimal separator.
   * The value must be a non-negative safe integer below the configured precision.
   */
  scale: number;

  /**
   * Allows a leading negative sign when explicitly enabled.
   * Unsigned canonical decimal strings remain the default format.
   */
  signed?: boolean;

  /**
   * Allows every canonical textual representation of zero by default.
   * Setting the option to `false` rejects signed and fractional zero values.
   */
  zeroAllowed?: boolean;
}>;

/**
 * Normalized format consumed by canonical decimal-string predicates.
 * Optional policies are resolved so every validator observes identical behavior.
 */
export type DecimalFormat = Readonly<{
  precision: number;
  scale: number;
  signed: boolean;
  zeroAllowed: boolean;
}>;
