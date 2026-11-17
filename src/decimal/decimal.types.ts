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
   * Maximum digit count accepted after the decimal separator of a value.
   * The value must be a non-negative safe integer below the set precision.
   */
  scale: number;

  /**
   * Allows a leading negative sign only when this option is explicitly enabled.
   * Unsigned canonical decimal strings remain the format accepted by default.
   */
  signed?: boolean;

  /**
   * Allows every canonical textual representation of zero by default.
   * Setting the option to `false` rejects signed and fractional zeros.
   */
  zeroAllowed?: boolean;
}>;

/**
 * Normalized format consumed by every canonical decimal-string predicate.
 * Omitted policies resolve to unsigned values that allow every zero form.
 */
export type DecimalFormat = Readonly<{
  precision: number;
  scale: number;
  signed: boolean;
  zeroAllowed: boolean;
}>;
