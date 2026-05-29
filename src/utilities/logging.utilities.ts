import { blue, dim, green, red, white, yellow } from 'kleur/colors';

import { getFormattedTime } from './datetime.utilities';

/**
 * HTTP status colors for better visual parsing in logs:
 * 2xx - green, 4xx - yellow, 5xx - red, others - default color.
 */
export function getColoredHTTPStatus(status: number): (text: string) => string {
  const colorMap: { range: [number, number]; colorFn: (text: string) => string }[] = [
    { range: [200, 299], colorFn: green },
    { range: [400, 499], colorFn: yellow },
    { range: [500, 599], colorFn: red },
  ];

  const statusColor = colorMap.find(({ range: [min, max] }) => status >= min && status <= max);
  return statusColor ? statusColor.colorFn : (text: string) => text;
}

// Unified logging function with color coding based on log level.
// Example: writeLog('Message', 'info', 'domain') -> [12:00:00 (-4 UTC)] domain       | Message
function writeLog(message: string, level: 'info' | 'warn' | 'error', service: string = 'log', stack?: string): void {
  const logColorMap = { info: blue, warn: yellow, error: red } satisfies Record<typeof level, (text: string) => string>;

  const timestamp = dim(getFormattedTime());
  const serviceName = logColorMap[level](service.padEnd(12));
  const formattedMessage = white(message);

  console.log(`[${timestamp}] ${serviceName} | ${formattedMessage}`);

  // If a stack trace is provided, log it separately with dim formatting.
  if (stack) console.log(`[${timestamp}] ${red('↳ trace').padEnd(18)} | ${dim(stack)}`);
}

/**
 * Unified logging interface for different levels (info, warn, error)
 * with optional service name and stack trace for errors (error level).
 */
export const log = {
  info: (message: string, service?: string) => writeLog(message, 'info', service),
  warn: (message: string, service?: string) => writeLog(message, 'warn', service),
  error: (message: string, service?: string, stack?: string) => writeLog(message, 'error', service, stack),
};
