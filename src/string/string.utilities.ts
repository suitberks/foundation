/**
 * Escapes backslashes and SQL wildcards so one value remains literal inside `LIKE` patterns.
 * Callers own surrounding wildcards and must configure backslash as the pattern escape character.
 *
 * @example
 * const pattern = `%${escapeLikePattern('50%_done')}%`;
 */
export function escapeLikePattern(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}
