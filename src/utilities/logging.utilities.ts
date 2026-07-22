import { blue, dim, green, red, white, yellow } from 'kleur/colors';

import { getFormattedTime } from './datetime.utilities';

// HTTP status ranges map response classes to stable terminal color functions;
// Statuses outside the configured ranges retain their original text appearance;

const HTTP_STATUS_COLORS = [
  { range: [200, 299], color: green },
  { range: [400, 499], color: yellow },
  { range: [500, 599], color: red },
] as const;

// Log levels share one color mapping for service labels and message categories;
// Keeping it module-scoped avoids rebuilding an immutable lookup for every line;

const LOG_LEVEL_COLORS = { info: blue, warn: yellow, error: red } as const;

/**
 * Selects a terminal color function for one HTTP response status.
 * Successes are green, client errors yellow, and server errors red.
 *
 * @example
 * getColoredHTTPStatus(404)('404');
 */
export function getColoredHTTPStatus(status: number): (text: string) => string {
  const statusColor = HTTP_STATUS_COLORS.find(({ range: [minimum, maximum] }) => {
    return status >= minimum && status <= maximum;
  });

  return statusColor ? statusColor.color : (text: string) => text;
}

/**
 * Writes one timestamped and colorized message using a stable service column.
 * Optional stack traces appear on a separate visually subordinate line.
 *
 * @example
 * writeLog('Request completed', 'info', 'http');
 */
function writeLog(
  message: string,
  level: keyof typeof LOG_LEVEL_COLORS,
  service: string = 'log',
  stack?: string
): void {
  const timestamp = dim(getFormattedTime());
  const serviceName = LOG_LEVEL_COLORS[level](service.padEnd(12));
  const formattedMessage = white(message);

  console.log(`[${timestamp}] ${serviceName} | ${formattedMessage}`);

  // Stack traces use a separate dimmed line beneath their primary error message;
  // Reusing the timestamp keeps both lines visually correlated in streamed output;

  if (stack) console.log(`[${timestamp}] ${red('↳ trace').padEnd(18)} | ${dim(stack)}`);
}

/**
 * Shared logging interface for informational, warning, and error messages.
 * Every level supports a service label while errors may include a stack trace.
 */
export const log = {
  /**
   * Writes an informational message with an optional service label.
   * Missing service names use the shared `log` fallback label.
   */
  info: (message: string, service?: string) => writeLog(message, 'info', service),

  /**
   * Writes a warning message with an optional service label.
   * Missing service names use the shared `log` fallback label.
   */
  warn: (message: string, service?: string) => writeLog(message, 'warn', service),

  /**
   * Writes an error message with optional service and stack trace context.
   * Stack traces are rendered beneath the primary error message when supplied.
   */
  error: (message: string, service?: string, stack?: string) => writeLog(message, 'error', service, stack),
};
