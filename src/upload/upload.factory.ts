import type { FileFormat } from './upload.enums';
import type { UploadPreset } from './upload.types';

/**
 * Defines one shared upload policy while preserving its literal format tuple.
 * The resulting preset can drive schemas, picker hints, and batch validation.
 *
 * @example
 * const imageUploadPreset = defineUploadPreset({
 *   formats: [fileFormat.JPG, fileFormat.PNG, fileFormat.WEBP],
 *   maxFileSize: 8 * 1024 * 1024,
 *   maxFilesCount: 1,
 * });
 */
export function defineUploadPreset<const TFormats extends readonly FileFormat[]>(
  preset: UploadPreset<TFormats>
): UploadPreset<TFormats> {
  return preset;
}
