import { fileFormatsConfig } from './upload.constants';
import type { FileFormat } from './upload.enums';

/**
 * Extracts a normalized trailing extension from a complete file name.
 * Returns an empty string when no valid dot-delimited suffix exists.
 */
export function getFileExtension(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf('.');

  return extensionIndex > 0 && extensionIndex < fileName.length - 1 ? fileName.slice(extensionIndex).toLowerCase() : '';
}

/**
 * Normalizes a configured extension to a lowercase dot-prefixed value.
 * Existing prefixes remain intact so repeated normalization is stable.
 */
export function normalizeFileExtension(extension: string): string {
  const normalizedExtension = extension.toLowerCase();

  return normalizedExtension.startsWith('.') ? normalizedExtension : `.${normalizedExtension}`;
}

/**
 * Compares a concrete MIME type with an exact or wildcard configuration.
 * Wildcards match every subtype belonging to the configured media group.
 */
export function matchesMimeType(fileMimeType: string, configuredMimeType: string): boolean {
  if (configuredMimeType.endsWith('/*')) return fileMimeType.startsWith(configuredMimeType.slice(0, -1));

  return fileMimeType === configuredMimeType;
}

/**
 * Checks whether a file MIME type belongs to one selected format.
 * File names and extensions cannot make an unsupported MIME type valid.
 */
export function isFileMimeTypeSupported(file: File, formats: readonly FileFormat[]): boolean {
  return formats.some((format) =>
    fileFormatsConfig[format].mimeTypes.some((mimeType) => matchesMimeType(file.type, mimeType))
  );
}

/**
 * Checks whether a file extension belongs to one selected format.
 * The comparison is case-insensitive and requires a complete suffix.
 */
export function isFileExtensionSupported(file: File, formats: readonly FileFormat[]): boolean {
  const fileExtension = getFileExtension(file.name);

  return formats.some((format) =>
    fileFormatsConfig[format].extensions.some((extension) => normalizeFileExtension(extension) === fileExtension)
  );
}

/**
 * Checks whether a file matches one configured MIME type or extension.
 * This permissive predicate supports clients where MIME metadata is absent.
 */
export function isFileFormatSupported(file: File, formats: readonly FileFormat[]): boolean {
  return isFileMimeTypeSupported(file, formats) || isFileExtensionSupported(file, formats);
}

/**
 * Builds a native file-picker hint from configured MIME types and extensions.
 * Duplicate values are removed while their configuration order is retained.
 */
export function createUploadAccept(formats: readonly FileFormat[]): string {
  const acceptedValues = formats.flatMap((format) => [
    ...fileFormatsConfig[format].mimeTypes,
    ...fileFormatsConfig[format].extensions,
  ]);

  return [...new Set(acceptedValues)].join(',');
}
