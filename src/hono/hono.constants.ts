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
