import type { UploadFormat, UploadPreset } from './upload.types';
import { assertUploadPreset } from './upload.validation';

/**
 * Defines one upload format while preserving its literal MIME and extension tuples.
 * Applications may enrich the returned object with their own display metadata.
 */
export function defineUploadFormat<const TFormat extends UploadFormat>(format: TFormat): TFormat {
  return format;
}

/**
 * Defines one shared upload policy while preserving its literal format tuple.
 * The resulting preset can drive schemas, picker hints, and batch validation.
 */
export function defineUploadPreset<const TFormats extends readonly UploadFormat[]>(
  preset: UploadPreset<TFormats>
): UploadPreset<TFormats> {
  assertUploadPreset(preset);

  return preset;
}
