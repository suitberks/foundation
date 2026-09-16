/**
 * Maximum byte count converted by one `String.fromCharCode` invocation.
 * Chunking keeps large payloads below engine-specific argument-count limits.
 */
export const BASE64_BYTE_CHUNK_SIZE = 0x8000;
