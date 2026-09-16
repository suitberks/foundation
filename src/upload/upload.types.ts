import type { Simplify } from '@/utilities/type.utilities';

import type { UploadValidationError } from './upload.enums';

/**
 * Transport metadata describing one file format accepted by an upload policy.
 * MIME types and extension collections remain application-owned literal values.
 */
export type UploadFormat = Readonly<{
  /**
   * MIME types accepted for files belonging to this format.
   * Exact values and complete media wildcards such as `image/*` are supported.
   */
  mimeTypes: readonly string[];

  /**
   * File extensions accepted when an upload policy enables extension fallback.
   * Values may include or omit their dot prefix and are matched case-insensitively.
   */
  extensions: readonly string[];
}>;

/**
 * Format matching policy shared by predicates and complete file validation.
 * Extension fallback remains disabled so MIME metadata is authoritative by default.
 */
export type UploadFormatValidationOptions<TFormats extends readonly UploadFormat[] = readonly UploadFormat[]> =
  Readonly<{
    /**
     * Format definitions accepted by this validation boundary.
     * Literal tuples remain available to consumers that define narrower policies.
     */
    formats: TFormats;

    /**
     * Allows extensions to compensate for absent or unreliable MIME metadata.
     * Omission preserves strict MIME validation across every adapter.
     */
    extensionFallback?: boolean;
  }>;

/**
 * Constraints used to validate one browser file independently of collection capacity.
 * Empty files remain invalid independently of the configured maximum size boundary.
 */
export type UploadFileValidationOptions<TFormats extends readonly UploadFormat[] = readonly UploadFormat[]> = Simplify<
  UploadFormatValidationOptions<TFormats> &
    Readonly<{
      /**
       * Maximum accepted size of one uploaded file measured in bytes.
       * The boundary must be a non-negative integer number of bytes.
       */
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
      /**
       * Optional maximum number of files retained by one upload collection.
       * Single-file controls can set this value to `1` for shared capacity rules.
       */
      maxFilesCount?: number;
    }>
>;

/**
 * Constraints used to validate an incoming collection of browser files.
 * Existing and incoming counts are combined when enforcing capacity.
 */
export type UploadFilesValidationOptions = Simplify<
  UploadPreset &
    Readonly<{
      /**
       * Number of files already retained before the incoming batch is validated.
       * Existing entries reduce the remaining capacity without being revalidated.
       */
      currentFilesCount: number;
    }>
>;

/**
 * Accepted files and the first rejection encountered in one batch.
 * Valid entries remain available when another entry fails validation.
 */
export type UploadFilesValidationResult = Readonly<{
  /**
   * Valid incoming files that fit the remaining collection capacity.
   * File objects preserve their identity and ordering through a readonly view.
   */
  acceptedFiles: readonly File[];

  /**
   * First stable rejection encountered while processing the incoming batch.
   * The field remains absent when every supplied file is accepted.
   */
  validationError?: UploadValidationError;
}>;
