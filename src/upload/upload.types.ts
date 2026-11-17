import type { Simplify } from '@/type';

import type { UploadValidationError } from './upload.enums';

/**
 * Transport metadata describing one file format accepted by an upload policy.
 * MIME types and extension collections remain application-owned literals.
 */
export type UploadFormat = Readonly<{
  /**
   * MIME types accepted for every uploaded file that belongs to this format.
   * Exact values and complete media wildcards such as `image/*` are supported.
   */
  mimeTypes: readonly string[];

  /**
   * File extensions accepted when an upload policy enables extension fallback.
   * Values may include or omit their dot prefix and match case-insensitively.
   */
  extensions: readonly string[];
}>;

/**
 * Format matching policy shared by predicates and complete file validation.
 * Extension fallback stays disabled so MIME metadata remains authoritative.
 */
export type UploadFormatValidationOptions<TFormats extends readonly UploadFormat[] = readonly UploadFormat[]> =
  Readonly<{
    formats: TFormats;
    extensionFallback?: boolean;
  }>;

/**
 * Constraints used to validate one browser file apart from collection capacity.
 * `maxFileSize` is measured in bytes, and empty files always remain invalid.
 */
export type UploadFileValidationOptions<TFormats extends readonly UploadFormat[] = readonly UploadFormat[]> = Simplify<
  UploadFormatValidationOptions<TFormats> &
    Readonly<{
      maxFileSize: number;
    }>
>;

/**
 * Shared upload policy consumed by browser controls and backend validation.
 * One preset keeps format, size, capacity, and fallback rules synchronized.
 */
export type UploadPreset<TFormats extends readonly UploadFormat[] = readonly UploadFormat[]> = Simplify<
  UploadFileValidationOptions<TFormats> &
    Readonly<{
      maxFilesCount?: number;
    }>
>;

/**
 * Constraints used to validate an incoming batch against collection capacity.
 * Existing and incoming file counts are combined when enforcing the capacity.
 */
export type UploadFilesValidationOptions<TFormats extends readonly UploadFormat[] = readonly UploadFormat[]> = Simplify<
  UploadPreset<TFormats> &
    Readonly<{
      currentFilesCount: number;
    }>
>;

/**
 * Accepted files and the first rejection encountered in one incoming batch.
 * Valid entries remain available when another entry fails its validation.
 */
export type UploadFilesValidationResult = Readonly<{
  acceptedFiles: readonly File[];
  validationError?: UploadValidationError;
}>;
