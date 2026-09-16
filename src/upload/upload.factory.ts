import { UPLOAD_FILE_EXTENSION_PATTERN, UPLOAD_MIME_TYPE_PATTERN } from './upload.constants';
import { uploadErrors } from './upload.errors';
import type { UploadFormat, UploadPreset } from './upload.types';
import { assertUploadPreset } from './upload.validation';

/**
 * Validates one upload format before it becomes part of a reusable policy.
 * Accepts MIME-only and extension-only definitions while rejecting malformed values.
 */
export function assertUploadFormat(format: UploadFormat): void {
  // ↓ Require at least one transport identifier for every declared format.

  const hasMimeTypes = format.mimeTypes.length > 0;
  const hasExtensions = format.extensions.length > 0;

  if (hasMimeTypes === false && hasExtensions === false) {
    throw uploadErrors.uploadFormatRequired();
  }

  // ↓ Validate every MIME declaration before inspecting file extensions.

  const hasInvalidMimeType = format.mimeTypes.some((mimeType) => {
    return UPLOAD_MIME_TYPE_PATTERN.test(mimeType.trim()) === false;
  });

  if (hasInvalidMimeType) {
    throw uploadErrors.invalidMimeType();
  }

  // ↓ Reject ambiguous compound extensions and path-like declarations.

  const hasInvalidFileExtension = format.extensions.some((extension) => {
    return UPLOAD_FILE_EXTENSION_PATTERN.test(extension.trim()) === false;
  });

  if (hasInvalidFileExtension) {
    throw uploadErrors.invalidFileExtension();
  }
}

/**
 * Defines one upload format while preserving its literal MIME and extension tuples.
 * Applications may enrich the returned object with their own display metadata.
 */
export function defineUploadFormat<const TFormat extends UploadFormat>(format: TFormat): TFormat {
  assertUploadFormat(format);

  return format;
}

/**
 * Defines one shared upload policy while preserving its literal format tuple.
 * The resulting preset can drive schemas, picker hints, and batch validation.
 */
export function defineUploadPreset<const TFormats extends readonly UploadFormat[]>(
  preset: UploadPreset<TFormats>
): UploadPreset<TFormats> {
  assertUploadPreset(preset);

  return preset;
}
