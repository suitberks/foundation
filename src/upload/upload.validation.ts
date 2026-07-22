import { uploadValidationError } from './upload.enums';
import type { FileFormat, UploadValidationError } from './upload.enums';
import type { UploadFilesValidationOptions, UploadFilesValidationResult } from './upload.types';
import { isFileFormatSupported } from './upload.utilities';

/**
 * Validates one file against configured format and size constraints.
 * Returns the first stable error key or nothing for a valid file.
 */
export function validateUploadFile(
  file: File,
  formats: readonly FileFormat[],
  maxFileSize: number
): UploadValidationError | undefined {
  if (file.size === 0) return uploadValidationError.EMPTY_FILE;
  if (isFileFormatSupported(file, formats) === false) return uploadValidationError.UNSUPPORTED_FILE_FORMAT;
  if (file.size > maxFileSize) return uploadValidationError.FILE_SIZE_EXCEEDED;

  return undefined;
}

/**
 * Validates an incoming collection while preserving every accepted file.
 * Returns accepted entries and the final rejection key from the batch.
 */
export function validateUploadFiles(
  incomingFiles: readonly File[],
  options: UploadFilesValidationOptions
): UploadFilesValidationResult {
  const { currentFilesCount, formats, maxFileSize, maxFilesCount } = options;
  const availableFilesCount = maxFilesCount === undefined ? Infinity : maxFilesCount - currentFilesCount;

  const acceptedFiles: File[] = [];
  let validationError: UploadValidationError | undefined;

  for (const file of incomingFiles) {
    const fileValidationError =
      validateUploadFile(file, formats, maxFileSize) ??
      // Collection limits apply only after intrinsic file validation succeeds.
      // This preserves remaining slots for supported files from the same batch.
      (acceptedFiles.length >= availableFilesCount ? uploadValidationError.FILES_COUNT_EXCEEDED : undefined);

    if (fileValidationError) {
      validationError = fileValidationError;
      continue;
    }

    acceptedFiles.push(file);
  }

  return { acceptedFiles, validationError };
}
