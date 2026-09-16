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
 * Options used to bind a logger to one service and output destination.
 * The default sink writes every fully formatted line through `console.log`.
 */
export type CreateLoggerOptions = {
  /**
   * Stable service label displayed beside every message from the logger.
   * Short labels retain the shared terminal column alignment automatically.
   */
  service: string;

  /**
   * Optional destination receiving each completely formatted output line.
   * Omission preserves the standard console-backed logging behavior.
   */
  sink?: LogSink;
};

/**
 * Structured values required to format one completed HTTP request log entry.
 * Optional query and body previews disappear when their normalized values are empty.
 */
export type HTTPRequestLogOptions = {
  /**
   * HTTP method associated with the completed request.
   * Formatting reserves a stable terminal column for its value.
   */
  method: string;

  /**
   * Final HTTP status observed after downstream request handling.
   * Its numeric range determines the terminal color applied to the value.
   */
  status: number;

  /**
   * Completed request-processing duration expressed in milliseconds.
   * Formatting expects the value to be rounded before it reaches this boundary.
   */
  duration: number;

  /**
   * Request pathname displayed without serialized query parameters.
   * Formatting reserves a stable terminal column for its value.
   */
  path: string;

  /**
   * Optional redacted query representation without the leading question mark.
   * Empty and omitted values do not produce a suffix in the formatted line.
   */
  searchParams?: string;

  /**
   * Optional normalized, redacted, and length-limited request body preview.
   * Empty and omitted values do not produce a suffix in the formatted line.
   */
  bodyPreview?: string;

  /**
   * Optional identifier correlating this request with downstream logs and reports.
   * Empty and omitted values do not produce a suffix in the formatted line.
   */
  requestId?: string;
};
