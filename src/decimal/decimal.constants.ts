/**
 * Matches every canonical textual zero, including signed and fractional forms.
 * Formats that disallow zero reject any value recognized by this expression.
 */
export const DECIMAL_ZERO_PATTERN = /^-?0(?:\.0+)?$/;
