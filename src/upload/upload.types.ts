import type { fileFormatsConfig } from './upload.constants';
import type { FileFormat, UploadValidationError } from './upload.enums';

// Derived upload types preserve the literal vocabulary owned by runtime collections;
// Format metadata and validation errors remain synchronized without duplication;

export type FileFormatConfig = (typeof fileFormatsConfig)[FileFormat];

/**
 * Shared upload policy consumed by browser controls and backend validation.
 * One preset keeps format, size, capacity, and fallback rules synchronized.
 */
export type UploadPreset<TFormats extends readonly FileFormat[] = readonly FileFormat[]> = Readonly<{
  /**
   * Supported formats accepted by every consumer of the preset.
   * Const inference preserves the supplied format tuple without widening.
   */
  formats: TFormats;

  /**
   * Maximum accepted size of one uploaded file measured in bytes.
   * Schema and client validation can share this exact numeric boundary.
   */
  maxFileSize: number;

  /**
   * Optional maximum number of files retained by one upload collection.
   * Single-file controls can set this value to `1` for shared capacity rules.
   */
  maxFilesCount?: number;

  /**
   * Allows extensions to compensate for absent or unreliable MIME metadata.
   * The fallback remains disabled when this option is omitted.
   */
  extensionFallback?: boolean;
}>;

/**
 * Constraints used to validate an incoming collection of browser files.
 * Existing and incoming counts are combined when enforcing capacity.
 */
export type UploadFilesValidationOptions = Readonly<{
  /**
   * Number of files already retained before the incoming batch is validated.
   * Existing entries reduce the remaining capacity without being revalidated.
   */
  currentFilesCount: number;

  /**
   * Supported formats used to validate every file in the incoming batch.
   * MIME and extension metadata are resolved through the canonical catalog.
   */
  formats: readonly FileFormat[];

  /**
   * Maximum accepted size of one uploaded file measured in bytes.
   * Files exceeding this boundary receive the stable size error key.
   */
  maxFileSize: number;

  /**
   * Optional maximum number of retained files after accepting the batch.
   * Omitting this value leaves collection capacity unrestricted.
   */
  maxFilesCount?: number;
}>;

/**
 * Accepted files and the final rejection encountered in one batch.
 * Valid entries remain available when another entry fails validation.
 */
export type UploadFilesValidationResult = Readonly<{
  /**
   * Valid incoming files that fit the remaining collection capacity.
   * Accepted file objects preserve their original identity and ordering.
   */
  acceptedFiles: File[];

  /**
   * Final stable rejection encountered while processing the incoming batch.
   * The field remains absent when every supplied file is accepted.
   */
  validationError?: UploadValidationError;
}>;

/**
 * Options used to construct one reusable Zod file schema.
 * Extension fallback is disabled by default to preserve strict MIME checks.
 */
export type ZodUploadFileSchemaOptions = Readonly<{
  /**
   * Supported formats accepted by the generated file schema.
   * Strict MIME validation uses metadata from the canonical format catalog.
   */
  formats: readonly FileFormat[];

  /**
   * Maximum accepted file size measured in bytes for the generated file schema.
   * Empty files remain invalid independently of this configured boundary.
   */
  maxFileSize: number;

  /**
   * Allows a supported extension to compensate for missing MIME metadata.
   * The fallback remains disabled by default to preserve strict validation.
   */
  extensionFallback?: boolean;
}>;
