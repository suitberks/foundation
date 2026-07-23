import { dim, red, white } from 'kleur/colors';

import { getFormattedTime } from '@/utilities/datetime.utilities';

import { logLevelColors } from './logging.constants';
import type { LogLevel } from './logging.enums';

function writeLog(message: string, level: LogLevel, service: string = 'log', stack?: string): void {
  // The service owns terminal output while callers select only a level, message, and label;
  // Timestamp formatting and aligned presentation remain consistent across every log method;

  const timestamp = dim(getFormattedTime());
  const serviceName = logLevelColors[level](service.padEnd(12));
  const formattedMessage = white(message);

  console.log(`[${timestamp}] ${serviceName} | ${formattedMessage}`);

  // Stack traces use a subordinate line but retain the timestamp of their primary error;
  // The fixed trace label keeps multiline failures aligned with ordinary service output;

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
    writeLog(message, 'info', service);
  },

  /**
   * Writes a warning message with an optional service label.
   * Missing service names use the shared `log` fallback label.
   */
  warn(message: string, service?: string): void {
    writeLog(message, 'warn', service);
  },

  /**
   * Writes an error message with optional service and stack trace context.
   * Provided stack traces are rendered beneath the primary message.
   */
  error(message: string, service?: string, stack?: string): void {
    writeLog(message, 'error', service, stack);
  },
};
