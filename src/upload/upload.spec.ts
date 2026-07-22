import { describe, expect, test } from 'bun:test';
import type { z } from 'zod';

import {
  type FileFormat,
  type UploadValidationError,
  createUploadAccept,
  fileFormat,
  fileFormatsArray,
  fileFormatsConfig,
  getFileExtension,
  isFileExtensionSupported,
  isFileFormatSupported,
  isFileMimeTypeSupported,
  matchesMimeType,
  normalizeFileExtension,
  uploadValidationError,
  uploadValidationErrorsArray,
  validateUploadFile,
  validateUploadFiles,
  zodUploadFileSchema,
} from '@/index';

// =====================================================================================================================
// COMPILE-TIME CONTRACT SUPPORT
// =====================================================================================================================

/**
 * Compares public types in both assignability directions for exactness.
 * The assertion protects literal unions derived from exported collections.
 */
type IsExact<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends <Value>() => Value extends Expected ? 1 : 2
    ? (<Value>() => Value extends Expected ? 1 : 2) extends <Value>() => Value extends Actual ? 1 : 2
      ? true
      : false
    : false;

/**
 * Constrains a compile-time proposition to true and fails typecheck otherwise.
 * Underscore-prefixed aliases document intentional type-only declarations.
 */
type Assert<Condition extends true> = Condition;

type _FileFormatContract = Assert<
  IsExact<FileFormat, 'png' | 'jpg' | 'webp' | 'avif' | 'heic' | 'pdf' | 'rtf' | 'txt'>
>;
type _ValidationErrorContract = Assert<
  IsExact<
    UploadValidationError,
    'empty_file' | 'unsupported_file_format' | 'file_size_exceeded' | 'files_count_exceeded'
  >
>;
type _ZodUploadOutputContract = Assert<IsExact<z.output<ReturnType<typeof zodUploadFileSchema>>, File>>;

// =====================================================================================================================
// FORMAT CATALOG AND FILE METADATA
// =====================================================================================================================

describe('upload format catalog', () => {
  test('keeps exported literal collections and aliases synchronized', () => {
    expect(fileFormatsArray).toContain(fileFormat.PNG);
    expect(fileFormatsArray).toContain(fileFormat.HEIC);
    expect(uploadValidationErrorsArray).toContain(uploadValidationError.UNSUPPORTED_FILE_FORMAT);
  });

  test('provides MIME types and normalized extensions for every format', () => {
    for (const format of fileFormatsArray) {
      expect(fileFormatsConfig[format].name.length).toBeGreaterThan(0);
      expect(fileFormatsConfig[format].mimeTypes.length).toBeGreaterThan(0);
      expect(fileFormatsConfig[format].extensions.every((extension) => extension.startsWith('.'))).toBe(true);
    }
  });
});

describe('upload metadata utilities', () => {
  test.each([
    ['photo.PNG', '.png'],
    ['archive.tar.gz', '.gz'],
    ['without-extension', ''],
    ['.hidden', ''],
    ['trailing.', ''],
  ])('extracts a normalized extension from %p', (fileName, expected) => {
    expect(getFileExtension(fileName)).toBe(expected);
  });

  test('normalizes extensions without duplicating the dot prefix', () => {
    expect(normalizeFileExtension('PNG')).toBe('.png');
    expect(normalizeFileExtension('.JpEg')).toBe('.jpeg');
  });

  test('matches exact MIME types and complete wildcard media groups', () => {
    expect(matchesMimeType('image/png', 'image/png')).toBe(true);
    expect(matchesMimeType('image/png', 'image/*')).toBe(true);
    expect(matchesMimeType('application/pdf', 'image/*')).toBe(false);
  });

  test('builds a stable native accept hint without duplicate values', () => {
    expect(createUploadAccept([fileFormat.JPG, fileFormat.PNG])).toBe('image/jpeg,.jpg,.jpeg,image/png,.png');
  });
});

// =====================================================================================================================
// FILE VALIDATION
// =====================================================================================================================

describe('upload file format predicates', () => {
  const pngWithoutMime = new File(['content'], 'IMAGE.PNG');
  const mismatchedFile = new File(['content'], 'image.png', { type: 'application/pdf' });

  test('keeps strict MIME and extension checks independently available', () => {
    expect(isFileMimeTypeSupported(pngWithoutMime, [fileFormat.PNG])).toBe(false);
    expect(isFileExtensionSupported(pngWithoutMime, [fileFormat.PNG])).toBe(true);

    expect(isFileMimeTypeSupported(mismatchedFile, [fileFormat.PNG])).toBe(false);
    expect(isFileExtensionSupported(mismatchedFile, [fileFormat.PNG])).toBe(true);
  });

  test('supports permissive client matching by MIME type or extension', () => {
    expect(isFileFormatSupported(pngWithoutMime, [fileFormat.PNG])).toBe(true);
    expect(isFileFormatSupported(mismatchedFile, [fileFormat.PNG])).toBe(true);
  });
});

describe('validateUploadFile', () => {
  test('returns stable keys in intrinsic validation order', () => {
    const emptyFile = new File([], 'empty.png', { type: 'image/png' });
    const unsupportedFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    const oversizedFile = new File([new Uint8Array(5)], 'image.png', { type: 'image/png' });

    expect(validateUploadFile(emptyFile, [fileFormat.PNG], 0)).toBe(uploadValidationError.EMPTY_FILE);
    expect(validateUploadFile(unsupportedFile, [fileFormat.PNG], 1024)).toBe(
      uploadValidationError.UNSUPPORTED_FILE_FORMAT
    );
    expect(validateUploadFile(oversizedFile, [fileFormat.PNG], 4)).toBe(uploadValidationError.FILE_SIZE_EXCEEDED);
  });

  test('accepts a supported file within the configured size', () => {
    const file = new File(['content'], 'image.png', { type: 'image/png' });

    expect(validateUploadFile(file, [fileFormat.PNG], file.size)).toBeUndefined();
  });
});

describe('validateUploadFiles', () => {
  test('preserves valid files from a partially rejected batch', () => {
    const validFile = new File(['image'], 'image.png', { type: 'image/png' });
    const unsupportedFile = new File(['document'], 'document.pdf', { type: 'application/pdf' });

    expect(
      validateUploadFiles([unsupportedFile, validFile], {
        currentFilesCount: 0,
        formats: [fileFormat.PNG],
        maxFileSize: 1024,
      })
    ).toEqual({
      acceptedFiles: [validFile],
      validationError: uploadValidationError.UNSUPPORTED_FILE_FORMAT,
    });
  });

  test('accepts only files that fit the remaining collection capacity', () => {
    const firstFile = new File(['first'], 'first.png', { type: 'image/png' });
    const secondFile = new File(['second'], 'second.png', { type: 'image/png' });

    expect(
      validateUploadFiles([firstFile, secondFile], {
        currentFilesCount: 1,
        formats: [fileFormat.PNG],
        maxFileSize: 1024,
        maxFilesCount: 2,
      })
    ).toEqual({
      acceptedFiles: [firstFile],
      validationError: uploadValidationError.FILES_COUNT_EXCEEDED,
    });
  });
});

// =====================================================================================================================
// ZOD FILE SCHEMAS
// =====================================================================================================================

describe('zodUploadFileSchema', () => {
  const strictPngSchema = zodUploadFileSchema({ formats: [fileFormat.PNG], maxFileSize: 8 });

  test('accepts supported non-empty files within the configured size', () => {
    const file = new File(['content'], 'image.png', { type: 'image/png' });

    expect(strictPngSchema.parse(file)).toBe(file);
  });

  test('reports stable validation keys for empty, oversized, and unsupported files', () => {
    const cases = [
      [new File([], 'empty.png', { type: 'image/png' }), uploadValidationError.EMPTY_FILE],
      [new File([new Uint8Array(9)], 'large.png', { type: 'image/png' }), uploadValidationError.FILE_SIZE_EXCEEDED],
      [new File(['content'], 'image.gif', { type: 'image/gif' }), uploadValidationError.UNSUPPORTED_FILE_FORMAT],
    ] as const;

    for (const [file, expectedMessage] of cases) {
      const result = strictPngSchema.safeParse(file);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues.map((issue) => issue.message)).toContain(expectedMessage);
    }
  });

  test('rejects extension-only matches unless fallback is explicitly enabled', () => {
    const file = new File(['content'], 'image.png');
    const fallbackSchema = zodUploadFileSchema({
      formats: [fileFormat.PNG],
      maxFileSize: 8,
      extensionFallback: true,
    });

    expect(strictPngSchema.safeParse(file).success).toBe(false);
    expect(fallbackSchema.safeParse(file).success).toBe(true);
  });
});
