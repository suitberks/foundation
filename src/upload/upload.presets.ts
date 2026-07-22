import { fileFormat } from './upload.enums';
import { defineUploadPreset } from './upload.factory';

/**
 * Default maximum size of one file accepted by the built-in upload presets.
 * The 20 MiB boundary matches the existing upload component policy.
 */
export const DEFAULT_UPLOAD_MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Ready-to-use policy for every image format supported by the upload catalog.
 * Each image may occupy up to 20 MiB while collection capacity remains unrestricted.
 */
export const imageUploadPreset = defineUploadPreset({
  formats: [fileFormat.PNG, fileFormat.JPG, fileFormat.WEBP, fileFormat.AVIF, fileFormat.HEIC],
  maxFileSize: DEFAULT_UPLOAD_MAX_FILE_SIZE,
});

/**
 * Ready-to-use policy for every document format supported by the upload catalog.
 * Each document may occupy up to 20 MiB while collection capacity remains unrestricted.
 */
export const documentUploadPreset = defineUploadPreset({
  formats: [fileFormat.PDF, fileFormat.RTF, fileFormat.TXT],
  maxFileSize: DEFAULT_UPLOAD_MAX_FILE_SIZE,
});
