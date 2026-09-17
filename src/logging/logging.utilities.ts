import { blue, bold, dim, white } from 'kleur/colors';

import { isString } from '@/guard';

import { httpStatusColors, LOG_BODY_PREVIEW_EDGE_LENGTH, MULTIPART_LOG_BODY } from './logging.constants';
import { loggingErrors } from './logging.errors';
import { redactSensitiveJSON } from './logging.security';
import type { HTTPRequestLogOptions } from './logging.types';

/**
 * Extracts useful trace context from an unknown failure without inventing a message.
 * Strings pass through directly, while native errors prefer their complete stack.
 */
export function normalizeLogError(error: unknown): string | undefined {
  if (isString(error)) return error;
  if (error instanceof Error === false) return undefined;

  return error.stack ?? error.message;
}

/**
 * Selects a terminal color function for one HTTP response status.
 * Successes are green, client errors yellow, and server errors red.
 */
export function getColoredHTTPStatus(status: number): (text: string) => string {
  const statusColor = httpStatusColors.find(({ range: [minimum, maximum] }) => {
    return status >= minimum && status <= maximum;
  });

  return statusColor ? statusColor.color : (text: string) => text;
}

/**
 * Formats one completed HTTP request as a compact colorized terminal line.
 * Empty query and body values are omitted without disturbing column alignment.
 */
export function formatHTTPRequestLog(options: HTTPRequestLogOptions): string {
  const method = bold(blue(options.method.padEnd(4)));
  const status = getColoredHTTPStatus(options.status)(String(options.status).padEnd(4));
  const duration = dim(`${options.duration}ms`.padStart(6));
  const path = white(options.path.padEnd(32));
  const searchParams = options.searchParams ? dim(` (${options.searchParams})`) : '';
  const bodyPreview = options.bodyPreview ? dim(` ${options.bodyPreview}`) : '';
  const requestId = options.requestId ? dim(` [${options.requestId}]`) : '';

  return `${method} ${status} ${duration} ${path}${searchParams}${bodyPreview}${requestId}`;
}

/**
 * Reads one request clone and returns a normalized, redacted, and bounded body preview.
 * Multipart requests return a safe marker without reading or retaining uploaded content.
 */
export async function createHTTPRequestBodyPreview(
  request: Request,
  contentType?: string,
  edgeLength: number = LOG_BODY_PREVIEW_EDGE_LENGTH
): Promise<string> {
  // ↓ Reject invalid limits before reading or cloning externally owned request content.

  const isInvalidEdgeLength = Number.isInteger(edgeLength) === false || edgeLength < 1;

  if (isInvalidEdgeLength) {
    throw loggingErrors.invalidBodyPreviewEdgeLength();
  }

  if (contentType?.includes('multipart/form-data')) return MULTIPART_LOG_BODY;

  const body = (await request.clone().text()).replaceAll(/\s+/g, ' ').trim();
  const redactedBody = redactSensitiveJSON(body);

  if (redactedBody.length <= edgeLength * 2) return redactedBody;

  // Preserve both payload boundaries while making removal of its center explicit.
  return `${redactedBody.slice(0, edgeLength)}…${redactedBody.slice(-edgeLength)}`;
}
