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
 * Options connecting one Zod schema to one supported Hono validation target.
 * Successful parsing preserves the schema output through `context.req.valid()`.
 */
export type HonoValidatorOptions<TSchema extends z.ZodType, TTarget extends keyof ValidationTargets> = {
  target: TTarget;
  schema: TSchema;
  createValidationError: HonoValidationErrorFactory;
};

/**
 * Options validating a request body only after enforcing its inclusive byte limit.
 * `maxSize` is checked before parsing, so oversized payloads are never consumed.
 */
export type HonoLimitedValidatorOptions<TSchema extends z.ZodType, TTarget extends 'form' | 'json'> = Simplify<
  HonoValidatorOptions<TSchema, TTarget> & {
    maxSize: number;
    createBodyTooLargeError: HonoValidationErrorFactory;
  }
>;

/**
 * Options validating Hono's flat standard query representation through Zod schemas.
 * Query coercion and normalization remain explicit responsibilities of the schema.
 */
export type HonoQueryValidatorOptions<TSchema extends z.ZodType> = Omit<
  HonoValidatorOptions<TSchema, 'query'>,
  'target'
>;

/**
 * Options controlling the application-owned side effect for unexpected failures.
 * Expected client exceptions bypass the callback and keep their stable error codes.
 */
export type HonoErrorHandlerOptions = {
  onUnexpectedError: (error: unknown, context: Context, requestId?: string) => void;
};

/**
 * Options controlling request metadata and body previews emitted by Hono middleware.
 * Defaults preserve the existing service label, body capture, and shared preview limit.
 */
export type HonoLoggingMiddlewareOptions = {
  /**
   * Service label passed to the configured writer beside every completed request.
   * Omission uses the stable `hono` label shared by the default logging middleware.
   */
  service?: string;

  /**
   * Destination receiving each formatted request line and its resolved service label.
   * Omission delegates output to the shared logging service at informational level.
   */
  write?: (message: string, service: string) => void;

  /**
   * Determines whether request bodies are cloned, normalized, and included in logs.
   * Omission enables previews to preserve the established default middleware behavior.
   */
  includeBody?: boolean;

  /**
   * Number of characters retained from each edge of an oversized body preview.
   * Omission uses the shared logging limit and invalid values reject immediately.
   */
  bodyPreviewEdgeLength?: number;

  /**
   * Header inspected for correlation after downstream middleware has completed.
   * Omission uses the same default header as the request identifier middleware.
   */
  requestIdHeader?: string;
};

/**
 * Options controlling acceptance and creation of request identifiers in Hono.
 * Valid incoming identifiers take precedence over locally generated values.
 */
export type HonoRequestIdMiddlewareOptions = {
  /**
   * Header read from incoming requests and written to every outgoing response.
   * Omission uses the shared `X-Request-ID` header name for both directions.
   */
  header?: string;

  /**
   * Factory invoked only when the incoming request lacks a valid identifier.
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
 * Options for one downloadable binary response with its attachment metadata.
 * The content type remains optional and falls back to a generic binary type.
 */
export type HonoFileRespondOptions<TStatus extends SuccessResponseStatus> = {
  status: TStatus;
  content: Uint8Array<ArrayBuffer>;
  filename: string;
  contentType?: string;
};
