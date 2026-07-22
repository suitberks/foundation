import { createStringEnumRecord } from '@/utilities/enums.utilities';

// `Upload` enumerations define supported format and validation error collections;
// Derived unions and records preserve one literal source for every public alias;

// == FILE FORMATS =====================================================================================================

export const fileFormatsArray = [
  ...['png', 'jpg', 'webp', 'avif', 'heic'], // Image formats.
  ...['pdf', 'rtf', 'txt'], // Text and document formats.
] as const;

export type FileFormat = (typeof fileFormatsArray)[number];

// Concise alias supports `fileFormat.PNG`, `fileFormat.PDF`, and other ergonomic access;
// Both exports preserve the same immutable record derived from `fileFormatsArray`;

export const fileFormatsRecord = createStringEnumRecord(fileFormatsArray);
export const fileFormat = fileFormatsRecord;

// == VALIDATION ERRORS =================================================================================================

export const uploadValidationErrorsArray = [
  'empty_file',
  'unsupported_file_format',
  'file_size_exceeded',
  'files_count_exceeded',
] as const;

export type UploadValidationError = (typeof uploadValidationErrorsArray)[number];

// Concise alias supports stable validation keys without repeating raw string literals;
// Both exports preserve the same immutable record derived from the canonical collection;

export const uploadValidationErrorsRecord = createStringEnumRecord(uploadValidationErrorsArray);
export const uploadValidationError = uploadValidationErrorsRecord;
