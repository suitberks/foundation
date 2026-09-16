/**
 * Structured values required to format one completed HTTP request log entry.
 * Optional query and body previews disappear when their normalized values are empty.
 */
export type HTTPRequestLogOptions = {
  // Request identity and final outcome recorded after downstream handling;
  // Duration is rounded to a whole number and expressed in milliseconds;

  method: string;
  status: number;
  duration: number;
  path: string;

  // Optional suffixes contain normalized and redacted request representations;
  // Search parameters omit `?`, while body previews enforce their length policy;

  searchParams?: string;
  bodyPreview?: string;
};
