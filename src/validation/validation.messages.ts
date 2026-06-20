// Default error message about at least one key being required.
export const AT_LEAST_ONE_DEFINED_ERROR = (keys: (string | number | symbol)[]) =>
  `At least one of the specified keys must be defined: ${keys.join(', ')}`;
