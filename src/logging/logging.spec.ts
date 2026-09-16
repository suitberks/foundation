import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';

import { green, red, yellow } from 'kleur/colors';

import {
  type CreateLoggerOptions,
  type HTTPRequestLogOptions,
  type LogLevel,
  type LogSink,
  type LoggingErrorCode,
  type ScopedLogger,
  LOG_BODY_PREVIEW_EDGE_LENGTH,
  MULTIPART_LOG_BODY,
  REDACTED_LOG_VALUE,
  createHTTPRequestBodyPreview,
  createLogger,
  formatHTTPRequestLog,
  getColoredHTTPStatus,
  httpStatusColors,
  log,
  logLevel,
  logLevelColors,
  logLevelsArray,
  logLevelsRecord,
  loggingErrors,
  normalizeLogError,
  redactSensitiveJSON,
  redactSensitiveSearchParams,
  redactSensitiveValue,
  sensitiveLogKeyParts,
} from '@/index';

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _LogLevelContract = Assert<IsExact<LogLevel, 'info' | 'warn' | 'error'>>;
type _LogSinkContract = Assert<IsExact<LogSink, (line: string) => void>>;
type _ScopedLoggerContract = Assert<
  IsExact<
    ScopedLogger,
    {
      info: (message: string) => void;
      warn: (message: string) => void;
      error: (message: string, error?: unknown) => void;
    }
  >
>;
type _CreateLoggerOptionsContract = Assert<IsExact<CreateLoggerOptions, { service: string; sink?: LogSink }>>;
type _LoggingErrorCodeContract = Assert<IsExact<LoggingErrorCode, 'invalidBodyPreviewEdgeLength'>>;
type _HTTPRequestLogOptionsContract = Assert<
  IsExact<
    HTTPRequestLogOptions,
    {
      method: string;
      status: number;
      duration: number;
      path: string;
      searchParams?: string;
      bodyPreview?: string;
      requestId?: string;
    }
  >
>;

afterEach(() => {
  mock.restore();
});

// =====================================================================================================================
// LOG LEVEL CATALOG
// =====================================================================================================================

describe('logging levels', () => {
  test('keeps the literal collection, aliases, and color configuration synchronized', () => {
    // One literal catalog drives both ergonomic access and exhaustive color configuration.
    expect(logLevelsArray).toEqual(['info', 'warn', 'error']);
    expect(logLevel.INFO).toBe('info');
    expect(logLevel.WARN).toBe('warn');
    expect(logLevel.ERROR).toBe('error');
    expect(logLevel).toBe(logLevelsRecord);
    expect(Object.keys(logLevelColors)).toEqual([...logLevelsArray]);
  });
});

// =====================================================================================================================
// LOGGING CONFIGURATION
// =====================================================================================================================

describe('logging configuration', () => {
  test('publishes stable redaction policy and ordered HTTP status ranges', () => {
    expect(REDACTED_LOG_VALUE).toBe('[redacted]');
    expect(LOG_BODY_PREVIEW_EDGE_LENGTH).toBe(30);
    expect(MULTIPART_LOG_BODY).toBe('[multipart]');
    expect(sensitiveLogKeyParts).toContain('password');
    expect(sensitiveLogKeyParts).toContain('token');
    expect(httpStatusColors.map(({ range }) => range)).toEqual([
      [200, 299],
      [400, 499],
      [500, 599],
    ]);
  });
});

// =====================================================================================================================
// REQUEST BODY PREVIEWS
// =====================================================================================================================

describe('createHTTPRequestBodyPreview', () => {
  test('normalizes and redacts ordinary request bodies without consuming the source', async () => {
    const request = new Request('https://example.com', {
      method: 'POST',
      body: '{\n  "password":  "secret", "name": "Foundation"\n}',
    });

    expect(await createHTTPRequestBodyPreview(request, 'application/json')).toBe(
      '{"password":"[redacted]","name":"Foundation"}'
    );
    expect(await request.text()).toContain('"password":  "secret"');
  });

  test('preserves both boundaries of an oversized body around one explicit ellipsis', async () => {
    const body = `${'a'.repeat(31)}${'b'.repeat(30)}`;
    const request = new Request('https://example.com', { method: 'POST', body });

    expect(await createHTTPRequestBodyPreview(request)).toBe(`${'a'.repeat(30)}…${'b'.repeat(30)}`);
  });

  test('returns the multipart marker without reading the request body', async () => {
    const request = new Request('https://example.com', { method: 'POST', body: 'binary-content' });

    expect(await createHTTPRequestBodyPreview(request, 'multipart/form-data; boundary=test')).toBe(MULTIPART_LOG_BODY);
    expect(await request.text()).toBe('binary-content');
  });

  test('applies an explicit edge limit and rejects invalid runtime limits', async () => {
    const request = new Request('https://example.com', { method: 'POST', body: 'abcdefghij' });

    expect(await createHTTPRequestBodyPreview(request, undefined, 3)).toBe('abc…hij');
    expect(createHTTPRequestBodyPreview(request, undefined, 0)).rejects.toThrow('invalidBodyPreviewEdgeLength');
    expect(loggingErrors.invalidBodyPreviewEdgeLength()).toMatchObject({
      name: 'RangeError',
      message: 'invalidBodyPreviewEdgeLength',
    });
  });
});

// =====================================================================================================================
// SENSITIVE VALUE REDACTION
// =====================================================================================================================

describe('sensitive log value redaction', () => {
  test('redacts partial case-insensitive key matches throughout nested JSON', () => {
    const source = JSON.stringify({
      email: 'visible@example.com',
      newPassword: 'password-value',
      nested: [{ access_token: 'token-value' }, { clientSecret: 'secret-value' }],
    });

    // Nested arrays and separator variants verify that matching is structural and normalized.
    expect(JSON.parse(redactSensitiveJSON(source))).toEqual({
      email: 'visible@example.com',
      newPassword: '[redacted]',
      nested: [{ access_token: '[redacted]' }, { clientSecret: '[redacted]' }],
    });
  });

  test('preserves JSON without sensitive keys and leaves invalid input unchanged', () => {
    const safeJSON = '{ "email": "visible@example.com" }';

    expect(redactSensitiveJSON(safeJSON)).toBe(safeJSON);
    expect(redactSensitiveJSON('invalid JSON')).toBe('invalid JSON');
  });

  test('returns redacted search parameters without mutating the source collection', () => {
    const source = new URLSearchParams('term=visible&passwordConfirmation=password-value&api_key=key-value');
    const redacted = redactSensitiveSearchParams(source);

    // The copy is safe to log while the original remains available to its request owner.
    expect(redacted.toString()).toBe('term=visible&passwordConfirmation=%5Bredacted%5D&api_key=%5Bredacted%5D');
    expect(source.toString()).toBe('term=visible&passwordConfirmation=password-value&api_key=key-value');
  });

  test('preserves repeated query keys and their ordering while redacting each value', () => {
    const source = new URLSearchParams('tag=first&access_token=one&tag=second&access_token=two');

    expect(redactSensitiveSearchParams(source).toString()).toBe(
      'tag=first&access_token=%5Bredacted%5D&tag=second&access_token=%5Bredacted%5D'
    );
  });

  test('redacts arbitrary nested structures without mutating the source value', () => {
    const source = { profile: { email: 'visible@example.com', apiKey: 'secret-value' } };

    expect(redactSensitiveValue(source)).toEqual({
      profile: { email: 'visible@example.com', apiKey: '[redacted]' },
    });
    expect(source.profile.apiKey).toBe('secret-value');
  });

  test('preserves built-in objects and circular references without traversing internal state', () => {
    const createdAt = new Date('2026-09-16T00:00:00.000Z');
    const source: { token: string; createdAt: Date; self?: unknown } = { token: 'secret-token', createdAt };
    source.self = source;

    const redacted = redactSensitiveValue(source) as typeof source;

    expect(redacted.token).toBe('[redacted]');
    expect(redacted.createdAt).toBe(createdAt);
    expect(redacted.self).toBe(redacted);
  });
});

// =====================================================================================================================
// HTTP STATUS COLOR SELECTION
// =====================================================================================================================

describe('getColoredHTTPStatus', () => {
  test.each([
    [200, green],
    [299, green],
    [400, yellow],
    [499, yellow],
    [500, red],
    [599, red],
  ] as const)('selects the documented color function for status %i', (status, expectedColor) => {
    // Function identity avoids coupling the assertion to terminal color-detection behavior.
    expect(getColoredHTTPStatus(status)).toBe(expectedColor);
  });

  test.each([0, 199, 300, 399, 600])(
    'returns a transparent formatter outside colored ranges for status %i',
    (status) => {
      expect(getColoredHTTPStatus(status)('status text')).toBe('status text');
    }
  );
});

describe('formatHTTPRequestLog', () => {
  test('formats required columns and omits empty optional suffixes', () => {
    const message = formatHTTPRequestLog({ method: 'GET', status: 200, duration: 12, path: '/health' });

    expect(message).toContain('GET');
    expect(message).toContain('200');
    expect(message).toContain('12ms');
    expect(message).toContain('/health');
    expect(message).not.toContain('()');
  });

  test('appends request correlation only when an identifier is provided', () => {
    const message = formatHTTPRequestLog({
      method: 'GET',
      status: 200,
      duration: 12,
      path: '/health',
      requestId: 'request-1',
    });

    expect(message).toContain('[request-1]');
  });
});

// =====================================================================================================================
// LOGGING SERVICE OUTPUT
// =====================================================================================================================

describe('log', () => {
  test('writes one labeled line for informational and warning messages', () => {
    const consoleLog = spyOn(console, 'log').mockImplementation(() => undefined);

    log.info('Worker ready', 'worker');
    log.warn('Queue delayed', 'queue');

    expect(consoleLog).toHaveBeenCalledTimes(2);
    expect(consoleLog.mock.calls[0]?.[0]).toContain('worker');
    expect(consoleLog.mock.calls[0]?.[0]).toContain('Worker ready');
    expect(consoleLog.mock.calls[1]?.[0]).toContain('queue');
    expect(consoleLog.mock.calls[1]?.[0]).toContain('Queue delayed');
  });

  test('writes an optional error stack on a correlated subordinate line', () => {
    const consoleLog = spyOn(console, 'log').mockImplementation(() => undefined);

    log.error('Request failed', 'http', 'Error: request failed');

    expect(consoleLog).toHaveBeenCalledTimes(2);
    expect(consoleLog.mock.calls[0]?.[0]).toContain('Request failed');
    expect(consoleLog.mock.calls[1]?.[0]).toContain('↳ trace');
    expect(consoleLog.mock.calls[1]?.[0]).toContain('Error: request failed');
  });

  test('normalizes native errors and ignores unsupported failure values', () => {
    const failure = new Error('requestFailed');

    expect(normalizeLogError(failure)).toContain('Error: requestFailed');
    expect(normalizeLogError('requestFailed')).toBe('requestFailed');
    expect(normalizeLogError({ message: 'requestFailed' })).toBeUndefined();
  });

  test('creates a service-bound logger with an injected output sink', () => {
    const lines: string[] = [];
    const logger = createLogger({ service: 'worker', sink: (line) => lines.push(line) });

    logger.info('Worker ready');
    logger.error('Request failed', new Error('requestFailed'));

    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('worker');
    expect(lines[0]).toContain('Worker ready');
    expect(lines[1]).toContain('Request failed');
    expect(lines[2]).toContain('Error: requestFailed');
  });
});
