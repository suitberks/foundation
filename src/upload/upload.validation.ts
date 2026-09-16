import { uploadValidationError } from './upload.enums';
import type { UploadValidationError } from './upload.enums';
import { uploadErrors } from './upload.errors';
import type {
  UploadFilesValidationOptions,
  UploadFilesValidationResult,
  UploadFileValidationOptions,
  UploadPreset,
} from './upload.types';
import { isFileFormatSupported } from './upload.utilities';

function resolveUploadFileValidationError(
  file: File,
  options: UploadFileValidationOptions
): UploadValidationError | undefined {
  if (file.size === 0) return uploadValidationError.EMPTY_FILE;
  if (isFileFormatSupported(file, options) === false) return uploadValidationError.UNSUPPORTED_FILE_FORMAT;
  if (file.size > options.maxFileSize) return uploadValidationError.FILE_SIZE_EXCEEDED;

  return undefined;
}

/**
 * Asserts that one file validation policy contains a usable size boundary.
 * Invalid configuration rejects before any externally owned file is inspected.
 */
export function assertUploadFileValidationOptions(options: UploadFileValidationOptions): void {
  const isInvalidMaxFileSize = Number.isInteger(options.maxFileSize) === false || options.maxFileSize < 0;

  if (isInvalidMaxFileSize) {
    throw uploadErrors.invalidMaxFileSize();
  }
}

/**
 * Asserts that one reusable upload preset contains a usable collection capacity.
 * Optional capacity remains unrestricted while supplied values require whole counts.
 */
export function assertUploadPreset(preset: UploadPreset): void {
  assertUploadFileValidationOptions(preset);

  const isInvalidMaxFilesCount =
    preset.maxFilesCount !== undefined &&
    (Number.isInteger(preset.maxFilesCount) === false || preset.maxFilesCount < 0);

  if (isInvalidMaxFilesCount) {
    throw uploadErrors.invalidMaxFilesCount();
  }
}

/**
 * Asserts that one collection policy contains usable integer capacity values.
 * Optional collection capacity remains unrestricted when it is omitted.
 */
export function assertUploadFilesValidationOptions(options: UploadFilesValidationOptions): void {
  assertUploadPreset(options);

  const isInvalidCurrentFilesCount =
    // Validates the current files count against the options and adds an issue if invalid.
    Number.isInteger(options.currentFilesCount) === false || options.currentFilesCount < 0;

  if (isInvalidCurrentFilesCount) {
    throw uploadErrors.invalidCurrentFilesCount();
  }
}

/**
 * Validates one file against configured format and size constraints.
 * Returns the first stable error key or nothing for a valid file.
 */
export function validateUploadFile(
  file: File,
  options: UploadFileValidationOptions
): UploadValidationError | undefined {
  assertUploadFileValidationOptions(options);
  return resolveUploadFileValidationError(file, options);
}

/**
 * Validates an incoming collection while preserving every accepted file.
 * Returns accepted entries and the first rejection key from the batch.
 */
export function validateUploadFiles(
  incomingFiles: readonly File[],
  options: UploadFilesValidationOptions
): UploadFilesValidationResult {
  assertUploadFilesValidationOptions(options);

  const { currentFilesCount, maxFilesCount } = options;

  const availableFilesCount = maxFilesCount === undefined ? Infinity : maxFilesCount - currentFilesCount;

  const acceptedFiles: File[] = [];
  let validationError: UploadValidationError | undefined;

  for (const file of incomingFiles) {
    // ↓ Apply capacity only after intrinsic validation preserves the slot for a supported file.

    const fileValidationError =
      resolveUploadFileValidationError(file, options) ??
      (acceptedFiles.length >= availableFilesCount ? uploadValidationError.FILES_COUNT_EXCEEDED : undefined);

    if (fileValidationError) {
      validationError ??= fileValidationError;
      continue;
    }

    acceptedFiles.push(file);
  }

  return { acceptedFiles, validationError };
}
