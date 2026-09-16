import { createStringEnumRecord } from '@/utilities/enums.utilities';

// `Upload` enums define stable validation results shared by every validation adapter;
// Derived unions and records preserve one authoritative source for the enum family;

// == ValidationErrors ==================================================

export const uploadValidationErrorsArray = [
  'emptyFile',
  'unsupportedFileFormat',
  'fileSizeExceeded',
  'filesCountExceeded',
] as const;

export type UploadValidationError = (typeof uploadValidationErrorsArray)[number];

// ↓ Descriptive and concise aliases share one immutable `UploadValidationError` record;

export const uploadValidationErrorsRecord = createStringEnumRecord(uploadValidationErrorsArray);
export const uploadValidationError = uploadValidationErrorsRecord;
