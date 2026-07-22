import { z } from 'zod';

import { uploadValidationError } from './upload.enums';
import type { ZodUploadFileSchemaOptions } from './upload.types';
import { isFileFormatSupported, isFileMimeTypeSupported } from './upload.utilities';

/**
 * Builds a reusable Zod schema for one uploaded file with format and size.
 * MIME matching is strict unless extension fallback is explicitly enabled.
 */
export function zodUploadFileSchema(options: ZodUploadFileSchemaOptions) {
  const { formats, maxFileSize, extensionFallback = false } = options;

  return z
    .file()
    .min(1, uploadValidationError.EMPTY_FILE)
    .max(maxFileSize, uploadValidationError.FILE_SIZE_EXCEEDED)
    .refine(
      (file) => (extensionFallback ? isFileFormatSupported(file, formats) : isFileMimeTypeSupported(file, formats)),
      uploadValidationError.UNSUPPORTED_FILE_FORMAT
    );
}
