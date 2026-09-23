import { createStringEnumRecord } from '@/string-enum';

// `Upload` enums define supported literal collections and synchronized public aliases.
// Derived unions and records preserve one authoritative source for every enum family.

// == ValidationErrors ==================================================

export const uploadValidationErrorsArray = [
  'emptyFile',
  'unsupportedFileFormat',
  'fileSizeExceeded',
  'filesCountExceeded',
] as const;

// ↓ Descriptive and concise aliases share one immutable `UploadValidationError` record.

export const uploadValidationErrorsRecord = createStringEnumRecord(uploadValidationErrorsArray);
export const uploadValidationError = uploadValidationErrorsRecord;

// ↓ Inferred literal union of values from `uploadValidationErrorsArray`.
export type UploadValidationError = (typeof uploadValidationErrorsArray)[number];
