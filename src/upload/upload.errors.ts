// Specific errors describing failure scenarios for `Upload`-related operations;
// Used by the owning module to communicate stable and machine-readable failures;

export const uploadErrors = {
  uploadFormatRequired: () => new TypeError('uploadFormatRequired'),
  invalidMimeType: () => new TypeError('invalidMimeType'),
  invalidFileExtension: () => new TypeError('invalidFileExtension'),
  invalidMaxFileSize: () => new RangeError('invalidMaxFileSize'),
  invalidMaxFilesCount: () => new RangeError('invalidMaxFilesCount'),
  invalidCurrentFilesCount: () => new RangeError('invalidCurrentFilesCount'),
};

// ↓ Inferred literal union of error codes from `uploadErrors`;
export type UploadErrorCode = keyof typeof uploadErrors;
