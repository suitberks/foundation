import type { Context } from 'hono';

import type { SuccessResponseStatus } from '@/response';

/**
 * Options controlling the application-owned side effect for unexpected Hono failures.
 * Expected client exceptions bypass the callback and retain their machine-readable code.
 */
export type HonoErrorHandlerOptions = {
  /**
   * Receives an unexpected failure, request context, and optional correlation identifier.
   * Applications may report original context without changing the public response envelope.
   */
  onUnexpectedError: (error: unknown, context: Context, requestId?: string) => void;
};

/**
 * Options controlling request metadata and body previews emitted by Hono middleware.
 * Defaults preserve the existing service label, body capture, and shared preview limit.
 */
export type HonoLoggingMiddlewareOptions = {
  /**
   * Service label passed to the configured writer beside every completed request.
   * Omission uses the stable `hono` label shared by the default middleware.
   */
  service?: string;

  /**
   * Destination receiving each formatted request line and its resolved service label.
   * Omission delegates output to the shared logging service at informational level.
   */
  write?: (message: string, service: string) => void;

  /**
   * Determines whether request bodies are cloned, normalized, and included in logs.
   * Omission enables previews to preserve the established middleware behavior.
   */
  includeBody?: boolean;

  /**
   * Number of characters retained from each edge of an oversized body preview.
   * Omission uses the shared logging limit and invalid values reject immediately.
   */
  bodyPreviewEdgeLength?: number;

  /**
   * Header inspected for request correlation after downstream middleware completes.
   * Omission uses the same default header as request identifier middleware.
   */
  requestIdHeader?: string;
};

/**
 * Options controlling acceptance and creation of request identifiers in Hono.
 * Existing non-empty identifiers take precedence over locally generated values.
 */
export type HonoRequestIdMiddlewareOptions = {
  /**
   * Header read from incoming requests and written to every outgoing response.
   * Omission uses the shared `X-Request-ID` header name.
   */
  header?: string;

  /**
   * Factory invoked only when the incoming request does not carry an identifier.
   * Omission generates a standards-based random UUID through the Web Crypto API.
   */
  createRequestId?: () => string;
};

/**
 * Options for a typed JSON response wrapped in the shared success envelope.
 * The status generic preserves the literal code inferred by the route contract.
 */
export type HonoRespondOptions<TData extends object, TStatus extends SuccessResponseStatus> = {
  status: TStatus;
  data?: TData;
};

/**
 * Options for a downloadable binary response with attachment metadata.
 * The content type remains optional and falls back to a generic binary type.
 */
export type HonoFileRespondOptions<TStatus extends SuccessResponseStatus> = {
  status: TStatus;
  content: Uint8Array<ArrayBuffer>;
  filename: string;
  contentType?: string;
};
