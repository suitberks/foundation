import { dim, red, white } from 'kleur/colors';

import { getFormattedTime } from '@/utilities/datetime.utilities';

import { logLevelColors } from './logging.constants';
import { logLevel } from './logging.enums';
import type { LogLevel } from './logging.enums';

function writeLog(message: string, level: LogLevel, service: string = 'log', stack?: string): void {
  const timestamp = dim(getFormattedTime());
  const serviceName = logLevelColors[level](service.padEnd(12));
  const formattedMessage = white(message);

  console.log(`[${timestamp}] ${serviceName} | ${formattedMessage}`);

  // Keep stack traces visually subordinate while correlating them with the primary timestamp.
  if (stack) console.log(`[${timestamp}] ${red('↳ trace').padEnd(18)} | ${dim(stack)}`);
}

/**
 * Writes timestamped and colorized messages using a stable service column.
 * Error messages may include a stack trace on a subordinate second line.
 */
export const log = {
  /**
   * Writes an informational message with an optional service label.
   * Missing service names use the shared `log` fallback label.
   */
  info(message: string, service?: string): void {
    writeLog(message, logLevel.INFO, service);
  },

  /**
   * Writes a warning message with an optional service label.
   * Missing service names use the shared `log` fallback label.
   */
  warn(message: string, service?: string): void {
    writeLog(message, logLevel.WARN, service);
  },

  /**
   * Writes an error message with optional service and stack trace context.
   * Provided stack traces are rendered beneath the primary message.
   */
  error(message: string, service?: string, stack?: string): void {
    writeLog(message, logLevel.ERROR, service, stack);
  },
};
