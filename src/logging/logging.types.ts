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
};
