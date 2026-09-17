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
  /**
   * Maximum digit count accepted across integer and fractional decimal parts.
   * Format construction guarantees a positive safe integer above `scale`.
   */
  precision: number;

  /**
   * Maximum digit count accepted after the decimal separator.
   * Format construction guarantees a non-negative safe integer below `precision`.
   */
  scale: number;

  /**
   * Indicates whether canonical decimal strings may include a leading minus sign.
   * The resolved boolean remains `false` when the source option was omitted.
   */
  signed: boolean;

  /**
   * Indicates whether signed and fractional textual zero values are accepted.
   * The resolved boolean remains `true` when the source option was omitted.
   */
  zeroAllowed: boolean;
}>;
