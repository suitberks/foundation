import type { Context, ValidationTargets } from 'hono';
import type { z } from 'zod';

import type { SuccessResponseStatus } from '@/response';
import type { Simplify } from '@/type';

/**
 * Factory creating an application-owned failure for invalid request data.
 * Adapters invoke it only after their transport-level validation has failed.
 */
export type HonoValidationErrorFactory = () => Error;

/**
 * Options connecting one Zod schema to a supported Hono validation target.
 * Successful parsing preserves the schema output through `context.req.valid()`.
 */
export type HonoValidatorOptions<TSchema extends z.ZodType, TTarget extends keyof ValidationTargets> = {
  /**
   * Hono request segment parsed and validated before downstream handling.
   * The selected target determines the key available through `context.req.valid()`.
   */
  target: TTarget;

  /**
   * Zod schema owning asynchronous parsing, coercion, and transformation.
   * Its output type becomes the validated value exposed to downstream handlers.
   */
  schema: TSchema;

  /**
   * Factory translating rejected input into an application-owned failure.
   * Applications retain ownership of status codes and machine-readable error codes.
   */
  createValidationError: HonoValidationErrorFactory;
};

/**
 * Options validating a request body only after enforcing its byte-size boundary.
 * The transport limit runs before parsing so oversized payloads are never consumed.
 */
export type HonoLimitedValidatorOptions<TSchema extends z.ZodType, TTarget extends 'form' | 'json'> = Simplify<
  HonoValidatorOptions<TSchema, TTarget> & {
    /**
     * Maximum accepted request-body size expressed as a positive integer of bytes.
     * The boundary is inclusive and enforced before the body reaches its Zod schema.
     */
    maxSize: number;

    /**
     * Factory translating an exceeded byte limit into an application-owned failure.
     * Applications retain ownership of status codes and machine-readable error codes.
     */
    createBodyTooLargeError: HonoValidationErrorFactory;
  }
>;

/**
 * Options validating Hono's flat standard query representation through Zod.
 * Query coercion and normalization remain explicit responsibilities of the schema.
 */
export type HonoQueryValidatorOptions<TSchema extends z.ZodType> = Omit<
  HonoValidatorOptions<TSchema, 'query'>,
  'target'
>;

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
