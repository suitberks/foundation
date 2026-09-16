import type { UploadFormat, UploadFormatValidationOptions } from './upload.types';

/**
 * Extracts a normalized trailing extension from a complete file name.
 * Returns an empty string when no valid dot-delimited suffix exists.
 */
export function getFileExtension(fileName: string): string {
  const normalizedFileName = fileName.trim();
  const extensionIndex = normalizedFileName.lastIndexOf('.');

  return extensionIndex > 0 && extensionIndex < normalizedFileName.length - 1
    ? normalizedFileName.slice(extensionIndex).toLowerCase()
    : '';
}

/**
 * Normalizes a configured extension to a lowercase dot-prefixed value.
 * Existing prefixes remain intact so repeated normalization is stable.
 */
export function normalizeFileExtension(extension: string): string {
  const normalizedExtension = extension.trim().toLowerCase();
  if (normalizedExtension.length === 0 || normalizedExtension === '.') return '';

  return normalizedExtension.startsWith('.') ? normalizedExtension : `.${normalizedExtension}`;
}

/**
 * Compares a concrete MIME type with an exact or wildcard configuration.
 * Wildcards match every subtype belonging to the configured media group.
 */
export function matchesMimeType(fileMimeType: string, configuredMimeType: string): boolean {
  const normalizedFileMimeType = fileMimeType.trim().toLowerCase();
  const normalizedConfiguredMimeType = configuredMimeType.trim().toLowerCase();

  const hasMimeType = /^[^/\s]+\/[^/\s]+$/.test(normalizedFileMimeType);
  const hasConfiguredMimeType = normalizedConfiguredMimeType.length > 0;
  if (hasMimeType === false || hasConfiguredMimeType === false) return false;

  if (normalizedConfiguredMimeType === '*/*') return true;
  if (normalizedConfiguredMimeType.endsWith('/*')) {
    const mediaTypePrefix = normalizedConfiguredMimeType.slice(0, -1);
    const mimeTypeLengthValid = normalizedFileMimeType.length > mediaTypePrefix.length;

    return normalizedFileMimeType.startsWith(mediaTypePrefix) && mimeTypeLengthValid;
  }

  return normalizedFileMimeType === normalizedConfiguredMimeType;
}

/**
 * Checks whether a file MIME type belongs to one selected format.
 * File names and extensions cannot make an unsupported MIME type valid.
 */
export function isFileMimeTypeSupported(file: File, formats: readonly UploadFormat[]): boolean {
  return formats.some((format) => format.mimeTypes.some((mimeType) => matchesMimeType(file.type, mimeType)));
}

/**
 * Checks whether a file extension belongs to one selected format.
 * The comparison is case-insensitive and requires a complete suffix.
 */
export function isFileExtensionSupported(file: File, formats: readonly UploadFormat[]): boolean {
  // ↓ Normalizes the file extension to lowercase and strips the dot prefix if present.

  const fileExtension = getFileExtension(file.name);
  if (fileExtension.length === 0) return false;

  return formats.some((format) =>
    format.extensions.some((extension) => normalizeFileExtension(extension) === fileExtension)
  );
}

/**
 * Checks whether a file satisfies the format policy selected by one validation boundary.
 * MIME matching remains strict unless the caller explicitly enables extension fallback.
 */
export function isFileFormatSupported(file: File, options: UploadFormatValidationOptions): boolean {
  const { formats, extensionFallback = false } = options;

  // ↓ Validates the file against the provided options and adds an issue if invalid.

  const isMimeTypeSupported = isFileMimeTypeSupported(file, formats);
  if (isMimeTypeSupported) return true;

  return extensionFallback && isFileExtensionSupported(file, formats);
}

/**
 * Builds a native file-picker hint from configured MIME types and extensions.
 * Duplicate values are removed while their configuration order is retained.
 */
export function createUploadAccept(formats: readonly UploadFormat[]): string {
  const acceptedValues = formats.flatMap((format) => [
    ...format.mimeTypes.map((mimeType) => mimeType.trim().toLowerCase()),
    ...format.extensions.map(normalizeFileExtension),
  ]);

  return [...new Set(acceptedValues.filter((value) => value.length > 0))].join(',');
}
