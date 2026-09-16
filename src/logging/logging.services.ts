import { dim, red, white } from 'kleur/colors';

import { getFormattedTime } from '@/datetime';

import { logLevelColors } from './logging.constants';
import type { LogLevel } from './logging.enums';
import { logLevel } from './logging.enums';
import type { CreateLoggerOptions, LogSink, ScopedLogger } from './logging.types';
import { normalizeLogError } from './logging.utilities';

/**
 * Writes one fully formatted logging line through the standard console destination.
 * Keeping the sink explicit allows configured loggers to replace output independently.
 */
function writeConsoleLog(line: string): void {
  console.log(line);
}

/**
 * Writes one normalized terminal message for the requested logging level and service.
 * Recognized error context retains the primary timestamp on a subordinate aligned line.
 */
function writeLog(
  message: string,
  level: LogLevel,
  service: string = 'log',
  error?: unknown,
  sink: LogSink = writeConsoleLog
): void {
  const timestamp = dim(getFormattedTime());
  const serviceName = logLevelColors[level](service.padEnd(12));
  const formattedMessage = white(message);
  const trace = normalizeLogError(error);

  sink(`[${timestamp}] ${serviceName} | ${formattedMessage}`);

  // Keep stack traces visually subordinate while correlating them with the primary timestamp.
  if (trace) sink(`[${timestamp}] ${red('↳ trace').padEnd(18)} | ${dim(trace)}`);
}

/**
 * Creates a logger permanently bound to one service label and output destination.
 * Calls retain the shared formatting while avoiding repeated service arguments.
 */
export function createLogger(options: CreateLoggerOptions): ScopedLogger {
  return {
    info(message) {
      writeLog(message, logLevel.INFO, options.service, undefined, options.sink);
    },
    warn(message) {
      writeLog(message, logLevel.WARN, options.service, undefined, options.sink);
    },
    error(message, error) {
      writeLog(message, logLevel.ERROR, options.service, error, options.sink);
    },
  };
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
   * Writes an error message with optional service and unknown failure context.
   * Native errors and strings render a normalized subordinate trace line.
   */
  error(message: string, service?: string, error?: unknown): void {
    writeLog(message, logLevel.ERROR, service, error);
  },
};
