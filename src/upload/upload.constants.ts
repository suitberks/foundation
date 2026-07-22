import type { FileFormat } from './upload.enums';
import { fileFormatsRecord } from './upload.enums';

/**
 * Structural metadata required from every supported upload format.
 * Concrete configuration values remain literal through inference.
 */
type FileFormatConfigShape = Readonly<{
  name: string;
  mimeTypes: readonly string[];
  extensions: readonly string[];
}>;

/**
 * Canonical metadata shared by upload controls and runtime validation.
 * Every supported format defines display, MIME, and extension values.
 */
export const fileFormatsConfig = {
  // Image formats.
  [fileFormatsRecord.PNG]: { name: 'PNG', mimeTypes: ['image/png'], extensions: ['.png'] },
  [fileFormatsRecord.JPG]: { name: 'JPG', mimeTypes: ['image/jpeg'], extensions: ['.jpg', '.jpeg'] },
  [fileFormatsRecord.WEBP]: { name: 'WEBP', mimeTypes: ['image/webp'], extensions: ['.webp'] },
  [fileFormatsRecord.AVIF]: { name: 'AVIF', mimeTypes: ['image/avif'], extensions: ['.avif'] },
  [fileFormatsRecord.HEIC]: { name: 'HEIC', mimeTypes: ['image/heic', 'image/heif'], extensions: ['.heic', '.heif'] },

  // Text and document formats.
  [fileFormatsRecord.PDF]: { name: 'PDF', mimeTypes: ['application/pdf'], extensions: ['.pdf'] },
  [fileFormatsRecord.RTF]: { name: 'RTF', mimeTypes: ['application/rtf'], extensions: ['.rtf'] },
  [fileFormatsRecord.TXT]: { name: 'TXT', mimeTypes: ['text/plain'], extensions: ['.txt'] },
} as const satisfies Record<FileFormat, FileFormatConfigShape>;
