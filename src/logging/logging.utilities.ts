import { httpStatusColors } from './logging.constants';

/**
 * Selects a terminal color function for one HTTP response status.
 * Successes are green, client errors yellow, and server errors red.
 */
export function getColoredHTTPStatus(status: number): (text: string) => string {
  const statusColor = httpStatusColors.find(({ range: [minimum, maximum] }) => {
    return status >= minimum && status <= maximum;
  });

  return statusColor ? statusColor.color : (text: string) => text;
}
