/**
 * Default HTTP header carrying one request identifier across service boundaries.
 * Incoming non-empty values are preserved while missing identifiers are generated.
 */
export const HONO_REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * Default service label applied to request lines emitted by Hono logging middleware.
 * Configured middleware may replace the label without changing message formatting.
 */
export const HONO_LOGGING_SERVICE = 'hono';

/**
 * Request identifiers accepted from clients and generators before reaching logs.
 * Bounded token characters prevent oversized values and terminal control injection.
 */
export const HONO_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
