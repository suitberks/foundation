import { blue, bold, dim, white } from 'kleur/colors';

import {
  HTTP_STATUS_COLORS,
  LOG_BODY_PREVIEW_EDGE_LENGTH,
  LOG_BODY_PREVIEW_MAX_BYTES,
  MULTIPART_LOG_BODY,
  OVERSIZED_LOG_BODY,
} from './logging.constants';
import { loggingErrors } from './logging.errors';
import { redactSensitiveFormBody, redactSensitiveJSON } from './logging.security';
import type { HTTPRequestLogOptions } from './logging.types';

/**
 * Reads one request clone as text while it stays within the supplied byte limit.
 * Oversized bodies resolve to `undefined` after releasing the cloned stream branch.
 */
async function readBoundedRequestText(request: Request, maxBytes: number): Promise<string | undefined> {
  const body = request.clone().body;

  if (body === null) {
    return '';
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];

  let byteLength = 0;

  try {
    for (let chunk = await reader.read(); chunk.done === false; chunk = await reader.read()) {
      byteLength += chunk.value.byteLength;

      if (byteLength > maxBytes) {
        return undefined;
      }

      chunks.push(chunk.value);
    }
  } finally {
    // Cancel only the cloned branch so downstream handlers still receive the original body.
    await reader.cancel();
  }

  return new Blob(chunks).text();
}

/**
 * Selects the terminal color function assigned to one HTTP response status code.
 * Successes are green, client errors are yellow, and server errors render red.
 */
export function getColoredHTTPStatus(status: number): (text: string) => string {
  const statusColor = HTTP_STATUS_COLORS.find(({ range: [minimum, maximum] }) => {
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
 * Reads one bounded request clone and returns a normalized, redacted body preview.
 * Multipart and oversized bodies return safe markers without logging partial content.
 */
export async function createHTTPRequestBodyPreview(
  request: Request,
  contentType?: string,
  edgeLength: number = LOG_BODY_PREVIEW_EDGE_LENGTH
): Promise<string> {
  // ↓ Reject invalid limits before reading or cloning externally owned request content.

  const hasValidEdgeLength = Number.isInteger(edgeLength) && edgeLength >= 1;

  if (hasValidEdgeLength === false) {
    throw loggingErrors.invalidBodyPreviewEdgeLength();
  }

  if (contentType?.includes('multipart/form-data')) {
    return MULTIPART_LOG_BODY;
  }

  const body = await readBoundedRequestText(request, LOG_BODY_PREVIEW_MAX_BYTES);

  if (body === undefined) {
    return OVERSIZED_LOG_BODY;
  }

  // ↓ Redact structured content before whitespace normalization changes its encoding.

  const isFormBody = contentType?.includes('application/x-www-form-urlencoded') === true;
  const redactedBody = (isFormBody ? redactSensitiveFormBody(body) : redactSensitiveJSON(body))
    .replaceAll(/\s+/g, ' ')
    .trim();

  if (redactedBody.length <= edgeLength * 2) {
    return redactedBody;
  }

  return `${redactedBody.slice(0, edgeLength)}…${redactedBody.slice(-edgeLength)}`;
}
