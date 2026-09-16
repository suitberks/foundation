/**
 * Matches concrete MIME types, one media wildcard, or the complete wildcard.
 * Tokens follow the transport-safe characters accepted by standard metadata.
 */
export const UPLOAD_MIME_TYPE_PATTERN = /^(?:\*\/\*|[A-Za-z0-9!#$&^_.+-]+\/(?:\*|[A-Za-z0-9!#$&^_.+-]+))$/;

/**
 * Matches one alphanumeric file extension with an optional leading dot.
 * Compound and path-like values remain invalid format declarations.
 */
export const UPLOAD_FILE_EXTENSION_PATTERN = /^\.?[A-Za-z0-9]+$/;
