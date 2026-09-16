import { z } from 'zod';

import type { UploadFileValidationOptions } from './upload.types';
import { assertUploadFileValidationOptions, validateUploadFile } from './upload.validation';

/**
 * Builds a reusable Zod schema for one uploaded file with format and size.
 * MIME matching is strict unless extension fallback is explicitly enabled.
 */
export function zodUploadFileSchema(options: UploadFileValidationOptions) {
  assertUploadFileValidationOptions(options);

  return z.file().superRefine((file, context) => {
    // ↓ Validates the file against the provided options and adds an issue if invalid.

    const validationError = validateUploadFile(file, options);
    if (validationError === undefined) return;

    context.addIssue({ code: 'custom', message: validationError });
  });
}
