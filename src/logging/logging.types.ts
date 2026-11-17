/**
 * Receives one completely formatted logging line for final output or collection.
 * Implementations control the destination without changing formatting behavior.
 */
export type LogSink = (line: string) => void;

/**
 * Logger bound to one service label and one configured output destination.
 * Every method preserves the shared timestamp, level, and trace formatting.
 */
export type ScopedLogger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: unknown) => void;
};

/**
 * Options used to bind a logger to one service and its output destination.
 * The default sink writes every fully formatted line through `console.log`.
 */
export type CreateLoggerOptions = {
  service: string;
  sink?: LogSink;
};

/**
 * Structured values required to format one completed HTTP request log entry.
 * Optional query and body previews disappear when their values are empty.
 */
export type HTTPRequestLogOptions = {
  /**
   * HTTP method printed in bold and padded to a stable four-character column.
   * Longer custom methods widen their own column instead of being truncated.
   */
  method: string;

  /**
   * Final HTTP status observed after all downstream request handling.
   * Its numeric range selects the terminal color applied to the value.
   */
  status: number;

  /**
   * Completed request-processing duration expressed in whole milliseconds.
   * Formatting expects the value to be rounded before reaching this boundary.
   */
  duration: number;

  /**
   * Request pathname printed without its query and padded to a stable column.
   * Query parameters belong in `searchParams` so the path column stays aligned.
   */
  path: string;

  /**
   * Redacted query string printed in parentheses without its leading `?`.
   * Formatting prints it verbatim, so sensitive values are removed first.
   */
  searchParams?: string;

  /**
   * Normalized, redacted, and length-limited preview of the request body.
   * Formatting prints it verbatim after the query suffix when non-empty.
   */
  bodyPreview?: string;

  /**
   * Identifier correlating this request with downstream reports and logs.
   * Formatting prints it in square brackets at the end of the line when set.
   */
  requestId?: string;
};
