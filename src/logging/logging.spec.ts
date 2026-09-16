import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';

import { green, red, yellow } from 'kleur/colors';

import {
  type HTTPRequestLogOptions,
  type LogLevel,
  LOG_BODY_PREVIEW_EDGE_LENGTH,
  MULTIPART_LOG_BODY,
  REDACTED_LOG_VALUE,
  createHTTPRequestBodyPreview,
  formatHTTPRequestLog,
  getColoredHTTPStatus,
  httpStatusColors,
  log,
  logLevel,
  logLevelColors,
  logLevelsArray,
  logLevelsRecord,
  redactSensitiveJSON,
  redactSensitiveSearchParams,
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
});
