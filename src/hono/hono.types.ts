import type { Context } from 'hono';

import type { SuccessStatusCode } from '@/http/http.types';

/**
 * Options controlling the application-owned side effect for unexpected Hono failures.
 * Expected client exceptions bypass the callback and retain their machine-readable code.
 */
export type HonoErrorHandlerOptions = {
  /**
   * Receives an unexpected failure and its request context before fallback response creation.
   * Applications may report the original error without changing the public response envelope.
   */
  onUnexpectedError: (error: unknown, context: Context) => void;
};

/**
 * Options for a typed JSON response wrapped in the shared API success envelope.
 * The status generic preserves the literal code inferred by the route contract.
 */
export type HonoRespondOptions<TData extends object, TStatus extends SuccessStatusCode> = {
  status: TStatus;
  data?: TData;
};

/**
 * Options for a downloadable binary response with attachment metadata.
 * The content type remains optional and falls back to a generic binary type.
 */
export type HonoFileRespondOptions<TStatus extends SuccessStatusCode> = {
  status: TStatus;
  content: Uint8Array<ArrayBuffer>;
  filename: string;
  contentType?: string;
};
