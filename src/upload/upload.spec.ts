import { describe, expect, test } from 'bun:test';

import type { z } from 'zod';

import {
  type UploadFileValidationOptions,
  type UploadFormat,
  type UploadFormatValidationOptions,
  type UploadPreset,
  type UploadErrorCode,
  type UploadValidationError,
  createUploadAccept,
  defineUploadFormat,
  defineUploadPreset,
  getFileExtension,
  isFileExtensionSupported,
  isFileFormatSupported,
  isFileMimeTypeSupported,
  matchesMimeType,
  normalizeFileExtension,
  uploadValidationError,
  uploadValidationErrorsArray,
  uploadErrors,
  validateUploadFile,
  validateUploadFiles,
  zodUploadFileSchema,
} from '@/index';

// These tests describe generic upload formats, policies, validation, and schema composition;
// They preserve literal inference and identical validation behavior across every public adapter;

// == CompileTimeContracts ==============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

const pngFormat = defineUploadFormat({ mimeTypes: ['image/png'], extensions: ['png', '.png'] });
const pdfFormat = defineUploadFormat({ mimeTypes: ['application/pdf'], extensions: ['pdf'] });
const imageFormat = defineUploadFormat({ mimeTypes: ['image/*'], extensions: [] });

const singleImageUploadPreset = defineUploadPreset({
  formats: [pngFormat],
  maxFileSize: 8 * 1024 * 1024,
  maxFilesCount: 1,
});

type _UploadFormatContract = Assert<
  IsExact<UploadFormat, Readonly<{ mimeTypes: readonly string[]; extensions: readonly string[] }>>
>;
type _UploadErrorCodeContract = Assert<
  IsExact<UploadErrorCode, 'invalidMaxFileSize' | 'invalidMaxFilesCount' | 'invalidCurrentFilesCount'>
>;
type _ValidationErrorContract = Assert<
  IsExact<UploadValidationError, 'emptyFile' | 'unsupportedFileFormat' | 'fileSizeExceeded' | 'filesCountExceeded'>
>;
type _UploadFormatValidationOptionsContract = Assert<
  IsExact<UploadFormatValidationOptions, Readonly<{ formats: readonly UploadFormat[]; extensionFallback?: boolean }>>
>;
type _UploadFileValidationOptionsContract = Assert<
  IsExact<
    UploadFileValidationOptions,
    Readonly<{
      formats: readonly UploadFormat[];
      maxFileSize: number;
      extensionFallback?: boolean;
    }>
  >
>;
type _UploadPresetContract = Assert<IsExact<typeof singleImageUploadPreset, UploadPreset<readonly [typeof pngFormat]>>>;
type _ZodUploadOutputContract = Assert<IsExact<z.output<ReturnType<typeof zodUploadFileSchema>>, File>>;

// == FormatDefinitions =================================================

describe('upload formats', () => {
  test('preserves literal format and preset definitions without adding runtime metadata', () => {
    expect(pngFormat).toEqual({ mimeTypes: ['image/png'], extensions: ['png', '.png'] });
    expect(singleImageUploadPreset).toEqual({
      formats: [pngFormat],
      maxFileSize: 8 * 1024 * 1024,
      maxFilesCount: 1,
    });
  });

  test('publishes synchronized camelCase validation errors', () => {
    expect(uploadValidationErrorsArray).toEqual([
      'emptyFile',
      'unsupportedFileFormat',
      'fileSizeExceeded',
      'filesCountExceeded',
    ]);
    expect(uploadValidationError).toEqual({
      EMPTY_FILE: 'emptyFile',
      UNSUPPORTED_FILE_FORMAT: 'unsupportedFileFormat',
      FILE_SIZE_EXCEEDED: 'fileSizeExceeded',
      FILES_COUNT_EXCEEDED: 'filesCountExceeded',
    });
  });

  test('rejects invalid preset configuration with stable error codes', () => {
    expect(() => defineUploadPreset({ formats: [pngFormat], maxFileSize: -1 })).toThrow('invalidMaxFileSize');
    expect(() => defineUploadPreset({ formats: [pngFormat], maxFileSize: 1, maxFilesCount: 1.5 })).toThrow(
      'invalidMaxFilesCount'
    );

    expect(uploadErrors.invalidMaxFileSize().message).toBe('invalidMaxFileSize');
  });
});

// == FileMetadata ======================================================

describe('upload metadata utilities', () => {
  test.each([
    ['photo.PNG', '.png'],
    [' photo.PDF ', '.pdf'],
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
    expect(normalizeFileExtension(' .PDF ')).toBe('.pdf');
    expect(normalizeFileExtension('')).toBe('');
    expect(normalizeFileExtension('.')).toBe('');
  });

  test('matches case-insensitive MIME types and complete wildcard media groups', () => {
    expect(matchesMimeType('image/png', 'image/png')).toBe(true);
    expect(matchesMimeType('IMAGE/PNG', 'image/png')).toBe(true);
    expect(matchesMimeType('image/png', 'image/*')).toBe(true);
    expect(matchesMimeType('application/pdf', '*/*')).toBe(true);
    expect(matchesMimeType('application/pdf', 'image/*')).toBe(false);
    expect(matchesMimeType('', '')).toBe(false);
    expect(matchesMimeType('image/', 'image/*')).toBe(false);
    expect(matchesMimeType('image/', '*/*')).toBe(false);
  });

  test('builds a normalized native accept hint without empty or duplicate values', () => {
    expect(createUploadAccept([pngFormat, pdfFormat])).toBe('image/png,.png,application/pdf,.pdf');
    expect(createUploadAccept([{ mimeTypes: [' IMAGE/PNG ', ''], extensions: [' PNG ', ''] }])).toBe('image/png,.png');
  });
});

// == FormatValidation ==================================================

describe('upload format predicates', () => {
  const pngWithoutMime = new File(['content'], 'IMAGE.PNG');
  const mismatchedFile = new File(['content'], 'image.png', { type: 'application/pdf' });
  const arbitraryImage = new File(['content'], 'image.gif', { type: 'image/gif' });

  test('keeps MIME and extension checks independently available', () => {
    expect(isFileMimeTypeSupported(pngWithoutMime, [pngFormat])).toBe(false);
    expect(isFileExtensionSupported(pngWithoutMime, [pngFormat])).toBe(true);
    expect(isFileMimeTypeSupported(arbitraryImage, [imageFormat])).toBe(true);
    expect(
      isFileExtensionSupported(new File(['content'], 'without-extension'), [{ mimeTypes: [], extensions: [''] }])
    ).toBe(false);
  });

  test('uses strict MIME matching unless extension fallback is enabled', () => {
    expect(isFileFormatSupported(pngWithoutMime, { formats: [pngFormat] })).toBe(false);
    expect(isFileFormatSupported(pngWithoutMime, { formats: [pngFormat], extensionFallback: true })).toBe(true);
    expect(isFileFormatSupported(mismatchedFile, { formats: [pngFormat] })).toBe(false);
    expect(isFileFormatSupported(mismatchedFile, { formats: [pngFormat], extensionFallback: true })).toBe(true);
  });
});

// == FileValidation ====================================================

describe('validateUploadFile', () => {
  const options = { formats: [pngFormat], maxFileSize: 4 };

  test('returns stable errors in intrinsic validation order', () => {
    const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
    const unsupportedFile = new File([new Uint8Array(5)], 'document.pdf', { type: 'application/pdf' });
    const oversizedFile = new File([new Uint8Array(5)], 'image.png', { type: 'image/png' });

    expect(validateUploadFile(emptyFile, options)).toBe(uploadValidationError.EMPTY_FILE);
    expect(validateUploadFile(unsupportedFile, options)).toBe(uploadValidationError.UNSUPPORTED_FILE_FORMAT);
    expect(validateUploadFile(oversizedFile, options)).toBe(uploadValidationError.FILE_SIZE_EXCEEDED);
  });

  test('shares explicit extension fallback with every validation adapter', () => {
    const file = new File(['data'], 'image.png');

    expect(validateUploadFile(file, options)).toBe(uploadValidationError.UNSUPPORTED_FILE_FORMAT);
    expect(validateUploadFile(file, { ...options, extensionFallback: true })).toBeUndefined();
  });

  test('rejects invalid size policies before inspecting the supplied file', () => {
    const file = new File(['data'], 'image.png', { type: 'image/png' });

    expect(() => validateUploadFile(file, { formats: [pngFormat], maxFileSize: -1 })).toThrow('invalidMaxFileSize');
    expect(() => validateUploadFile(file, { formats: [pngFormat], maxFileSize: 1.5 })).toThrow('invalidMaxFileSize');
    expect(() => zodUploadFileSchema({ formats: [pngFormat], maxFileSize: Infinity })).toThrow('invalidMaxFileSize');
  });
});

describe('validateUploadFiles', () => {
  test('preserves valid files from a partially rejected batch', () => {
    const validFile = new File(['image'], 'image.png', { type: 'image/png' });
    const unsupportedFile = new File(['document'], 'document.pdf', { type: 'application/pdf' });

    expect(
      validateUploadFiles([unsupportedFile, validFile], {
        currentFilesCount: 0,
        formats: [pngFormat],
        maxFileSize: 1024,
      })
    ).toEqual({
      acceptedFiles: [validFile],
      validationError: uploadValidationError.UNSUPPORTED_FILE_FORMAT,
    });
  });

  test('preserves the first rejection while continuing to collect valid files', () => {
    const unsupportedFile = new File(['document'], 'document.pdf', { type: 'application/pdf' });
    const oversizedFile = new File([new Uint8Array(5)], 'large.png', { type: 'image/png' });
    const validFile = new File(['ok'], 'valid.png', { type: 'image/png' });

    expect(
      validateUploadFiles([unsupportedFile, oversizedFile, validFile], {
        currentFilesCount: 0,
        formats: [pngFormat],
        maxFileSize: 4,
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
        formats: [pngFormat],
        maxFileSize: 1024,
        maxFilesCount: 2,
      })
    ).toEqual({
      acceptedFiles: [firstFile],
      validationError: uploadValidationError.FILES_COUNT_EXCEEDED,
    });
  });

  test('applies extension fallback consistently throughout a batch', () => {
    const file = new File(['image'], 'image.png');

    expect(
      validateUploadFiles([file], {
        currentFilesCount: 0,
        formats: [pngFormat],
        maxFileSize: 1024,
        extensionFallback: true,
      })
    ).toEqual({ acceptedFiles: [file], validationError: undefined });
  });

  test('rejects invalid collection counts before processing a batch', () => {
    const basePreset = { formats: [pngFormat], maxFileSize: 1024 };
    const file = new File(['image'], 'image.png', { type: 'image/png' });

    expect(() => defineUploadPreset({ ...basePreset, maxFilesCount: -1 })).toThrow('invalidMaxFilesCount');
    expect(() => validateUploadFiles([file], { ...basePreset, currentFilesCount: 0.5 })).toThrow(
      'invalidCurrentFilesCount'
    );
  });
});

// == ZodSchemas ========================================================

describe('zodUploadFileSchema', () => {
  const options = { formats: [pngFormat], maxFileSize: 8 };
  const strictPngSchema = zodUploadFileSchema(options);

  test('accepts supported non-empty files within the configured size', () => {
    const file = new File(['content'], 'image.png', { type: 'image/png' });

    expect(strictPngSchema.parse(file)).toBe(file);
  });

  test('uses the same first-error ordering as direct validation', () => {
    const cases = [
      new File([], 'empty.pdf', { type: 'application/pdf' }),
      new File([new Uint8Array(9)], 'large.pdf', { type: 'application/pdf' }),
      new File([new Uint8Array(9)], 'large.png', { type: 'image/png' }),
    ];

    for (const file of cases) {
      const expectedError = validateUploadFile(file, options);
      const result = strictPngSchema.safeParse(file);

      expect(result.success).toBe(false);
      if (result.success === false) expect(result.error.issues[0]?.message).toBe(expectedError);
    }
  });

  test('rejects extension-only matches unless fallback is explicitly enabled', () => {
    const file = new File(['content'], 'image.png');
    const fallbackSchema = zodUploadFileSchema({ ...options, extensionFallback: true });

    expect(strictPngSchema.safeParse(file).success).toBe(false);
    expect(fallbackSchema.safeParse(file).success).toBe(true);
  });
});
