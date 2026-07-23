import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { Hono } from 'hono';
import { green, red, yellow } from 'kleur/colors';

import {
  type LogLevel,
  REDACTED_LOG_VALUE,
  getColoredHTTPStatus,
  httpStatusColors,
  log,
  logLevel,
  logLevelColors,
  logLevelsArray,
  loggingMiddleware,
  redactSensitiveJSON,
  redactSensitiveSearchParams,
  sensitiveLogKeyParts,
} from '@/index';

/**
 * Compares public types in both assignability directions for exactness.
 * The assertion protects literal unions derived from exported collections.
 */
type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

/**
 * Constrains a compile-time proposition to true and fails typecheck otherwise.
 * Underscore-prefixed aliases document intentional type-only declarations.
 */
type Assert<TCondition extends true> = TCondition;

type _LogLevelContract = Assert<IsExact<LogLevel, 'info' | 'warn' | 'error'>>;

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
    expect(Object.keys(logLevelColors)).toEqual([...logLevelsArray]);
  });
});

// =====================================================================================================================
// LOGGING CONFIGURATION
// =====================================================================================================================

describe('logging configuration', () => {
  test('publishes stable redaction policy and ordered HTTP status ranges', () => {
    expect(REDACTED_LOG_VALUE).toBe('[redacted]');
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

// =====================================================================================================================
// HONO REQUEST LOGGING MIDDLEWARE
// =====================================================================================================================

describe('loggingMiddleware', () => {
  test('logs method, status, duration, path, and query details', async () => {
    const infoLog = spyOn(log, 'info').mockImplementation(() => undefined);
    const app = new Hono();

    app.use('*', loggingMiddleware);
    app.get('/search', (c) => c.json({ matched: true }));

    const response = await app.request('/search?term=foundation&limit=2');

    // A real Hono request verifies middleware continuation and final response behavior together.
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ matched: true });

    const loggedCall = infoLog.mock.calls[0];
    if (!loggedCall) throw new Error('The request logger did not emit its expected call');
    const [message, service] = loggedCall;

    // Duration is checked by shape because wall-clock measurements are intentionally nondeterministic.
    expect(service).toBe('hono');
    expect(message).toContain('GET');
    expect(message).toContain('200');
    expect(message).toMatch(/\d+ms/);
    expect(message).toContain('/search');
    expect(message).toContain('(term=foundation&limit=2)');
  });

  test('logs a normalized body without consuming the route handler stream', async () => {
    const infoLog = spyOn(log, 'info').mockImplementation(() => undefined);
    const app = new Hono();
    const body = '{\n  "name":   "Foundation"\n}';

    app.use('*', loggingMiddleware);
    app.post('/echo', async (c) => c.text(await c.req.text()));

    const response = await app.request('/echo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    // Logging reads the clone while the handler observes the original byte-for-byte body.
    expect(await response.text()).toBe(body);
    expect(infoLog.mock.calls[0]?.[0]).toContain('{ "name": "Foundation" }');
    expect(infoLog.mock.calls[0]?.[0]).not.toContain('\n');
  });

  test('shortens long bodies while preserving their beginning and end', async () => {
    const infoLog = spyOn(log, 'info').mockImplementation(() => undefined);
    const app = new Hono();
    const body = `${'a'.repeat(31)}${'b'.repeat(30)}`;

    app.use('*', loggingMiddleware);
    app.post('/long-body', (c) => c.body(null, 204));
    await app.request('/long-body', { method: 'POST', body });

    const message = infoLog.mock.calls[0]?.[0];

    // Both edges remain visible and the complete over-limit source never reaches output.
    expect(message).toContain(`${'a'.repeat(30)}…${'b'.repeat(30)}`);
    expect(message).not.toContain(body);
  });

  test('logs a placeholder without reading multipart form data', async () => {
    const infoLog = spyOn(log, 'info').mockImplementation(() => undefined);
    const app = new Hono();

    app.use('*', loggingMiddleware);
    app.post('/upload', async (c) => {
      const formData = await c.req.formData();
      const name = formData.get('name');
      if (typeof name !== 'string') throw new Error('Expected the multipart name field to be text');
      return c.text(name);
    });

    const formData = new FormData();
    formData.set('name', 'Foundation');
    const response = await app.request('/upload', { method: 'POST', body: formData });

    // The handler can parse its form while the logger exposes only the media-type placeholder.
    expect(await response.text()).toBe('Foundation');
    expect(infoLog.mock.calls[0]?.[0]).toContain('[multipart]');
    expect(infoLog.mock.calls[0]?.[0]).not.toContain('Foundation');
  });

  test('redacts sensitive query and nested JSON values before logging', async () => {
    const infoLog = spyOn(log, 'info').mockImplementation(() => undefined);
    const app = new Hono();
    const body = JSON.stringify({
      email: 'visible@example.com',
      newPassword: 'secret-password',
      nested: { clientSecret: 'secret-client', access_token: 'secret-token' },
    });

    app.use('*', loggingMiddleware);
    app.post('/secure', async (c) => c.text(await c.req.text()));

    const response = await app.request('/secure?term=visible&passwordConfirmation=secret-query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    expect(await response.text()).toBe(body);

    const message = infoLog.mock.calls[0]?.[0];

    // Safe context remains useful while every configured sensitive value is absent.
    expect(message).toContain('term=visible');
    expect(message).toContain('visible@example.com');
    expect(message).toContain('%5Bredacted%5D');
    expect(message).toContain('[redacted]');
    expect(message).not.toContain('secret-query');
    expect(message).not.toContain('secret-password');
    expect(message).not.toContain('secret-client');
    expect(message).not.toContain('secret-token');
  });
});
