import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';

import { type Context, Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { UnofficialStatusCode } from 'hono/utils/http-status';

import {
  type ErrorResponse,
  type HonoErrorCode,
  type HonoErrorHandlerOptions,
  type HonoFileRespondOptions,
  type HonoLoggingMiddlewareOptions,
  type HonoRequestIdMiddlewareOptions,
  type HonoRespondOptions,
  type SuccessResponse,
  createHonoErrorHandler,
  createLoggingMiddleware,
  createRequestIdMiddleware,
  fileRespond,
  honoErrors,
  log,
  loggingMiddleware,
  requestIdMiddleware,
  respond,
} from '@/index';

// These tests cover Hono response envelopes, file downloads, and global error handling behavior;
// They preserve exact public contracts, binary content, stable failures, and reporting boundaries;

// == CompileTimeContracts =============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _HonoErrorCodeContract = Assert<IsExact<HonoErrorCode, 'internalServerError' | 'invalidRequestId'>>;
type _HonoRespondOptionsContract = Assert<
  IsExact<HonoRespondOptions<{ id: string }, 201>, { status: 201; data?: { id: string } }>
>;
type _HonoFileRespondOptionsContract = Assert<
  IsExact<
    HonoFileRespondOptions<200>,
    { status: 200; content: Uint8Array<ArrayBuffer>; filename: string; contentType?: string }
  >
>;
type _HonoErrorHandlerOptionsContract = Assert<
  IsExact<
    HonoErrorHandlerOptions,
    { onUnexpectedError: (error: unknown, context: Context, requestId?: string) => void }
  >
>;
type _HonoLoggingMiddlewareOptionsContract = Assert<
  IsExact<
    HonoLoggingMiddlewareOptions,
    {
      service?: string;
      write?: (message: string, service: string) => void;
      includeBody?: boolean;
      bodyPreviewEdgeLength?: number;
      requestIdHeader?: string;
    }
  >
>;
type _HonoRequestIdMiddlewareOptionsContract = Assert<
  IsExact<HonoRequestIdMiddlewareOptions, { header?: string; createRequestId?: () => string }>
>;

afterEach(() => {
  mock.restore();
});

async function readJSON<TData>(response: Response): Promise<TData> {
  return (await response.json()) as TData;
}

function createThrowingApp(error: unknown, options: HonoErrorHandlerOptions): Hono {
  const app = new Hono();

  app.onError(createHonoErrorHandler(options));
  app.get('/error', () => {
    throw error;
  });

  return app;
}

// == JSONResponses =====================================================

describe('respond', () => {
  test('returns the requested status and wraps data in the shared success envelope', async () => {
    const app = new Hono();

    app.post('/users', (context) => respond(context, { status: 201, data: { id: 'user-1' } }));

    const response = await app.request('/users', { method: 'POST' });

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await readJSON<SuccessResponse<{ id: string }>>(response)).toEqual({
      kind: 'success',
      status: 201,
      data: { id: 'user-1' },
    });
  });

  test('uses an empty object when optional response data is omitted', async () => {
    const app = new Hono();

    app.get('/accepted', (context) => respond(context, { status: 202 }));

    const response = await app.request('/accepted');

    expect(response.status).toBe(202);
    expect(await readJSON<SuccessResponse<Record<string, never>>>(response)).toEqual({
      kind: 'success',
      status: 202,
      data: {},
    });
  });
});

// == FileResponses =====================================================

describe('fileRespond', () => {
  test('returns binary content with attachment and custom content type headers', async () => {
    const app = new Hono();
    const content = new TextEncoder().encode('identifier,name\nasset-1,Foundation');

    app.get('/assets.csv', (context) =>
      fileRespond(context, {
        status: 200,
        content,
        filename: 'assets.csv',
        contentType: 'text/csv; charset=utf-8',
      })
    );

    const response = await app.request('/assets.csv');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="assets.csv"');
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(content);
  });

  test('uses the binary content type by default and preserves arbitrary bytes', async () => {
    const app = new Hono();
    const content = new Uint8Array([0, 1, 127, 128, 255]);

    app.get('/archive.bin', (context) =>
      fileRespond(context, {
        status: 201,
        content,
        filename: 'archive.bin',
      })
    );

    const response = await app.request('/archive.bin');

    expect(response.status).toBe(201);
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="archive.bin"');
    expect(response.headers.get('content-type')).toBe('application/octet-stream');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(content);
  });
});

// == ErrorHandling =====================================================

describe('honoErrors', () => {
  test('creates stable machine-readable framework failures', () => {
    const internalServerError = honoErrors.internalServerError();
    const invalidRequestId = honoErrors.invalidRequestId();

    expect(internalServerError).toBeInstanceOf(HTTPException);
    expect(internalServerError.status).toBe(500);
    expect(internalServerError.message).toBe('internalServerError');
    expect(invalidRequestId).toMatchObject({ name: 'TypeError', message: 'invalidRequestId' });
  });
});

describe('createHonoErrorHandler', () => {
  test('preserves expected client exceptions without reporting them as unexpected', async () => {
    const reportedErrors: unknown[] = [];
    const app = createThrowingApp(new HTTPException(404, { message: 'recordNotFound' }), {
      onUnexpectedError: (error) => reportedErrors.push(error),
    });

    const response = await app.request('/error');

    expect(response.status).toBe(404);
    expect(await readJSON<ErrorResponse>(response)).toEqual({
      kind: 'error',
      status: 404,
      error: 'recordNotFound',
    });
    expect(reportedErrors).toEqual([]);
  });

  test('rejects unofficial client statuses outside the shared response catalog', async () => {
    const reportedErrors: unknown[] = [];
    const error = new HTTPException(499 as UnofficialStatusCode, { message: 'customClientFailure' });
    const app = createThrowingApp(error, { onUnexpectedError: (reportedError) => reportedErrors.push(reportedError) });

    const response = await app.request('/error');

    expect(response.status).toBe(500);
    expect(await readJSON<ErrorResponse<HonoErrorCode>>(response)).toEqual({
      kind: 'error',
      status: 500,
      error: 'internalServerError',
    });
    expect(reportedErrors).toEqual([error]);
  });

  test('reports unexpected failures with request context and returns a stable fallback', async () => {
    const failure = new Error('databaseUnavailable');
    const reported: Array<{ error: unknown; pathname: string }> = [];
    const app = createThrowingApp(failure, {
      onUnexpectedError: (error, context) => reported.push({ error, pathname: new URL(context.req.url).pathname }),
    });

    const response = await app.request('/error');

    expect(response.status).toBe(500);
    expect(await readJSON<ErrorResponse<HonoErrorCode>>(response)).toEqual({
      kind: 'error',
      status: 500,
      error: 'internalServerError',
    });
    expect(reported).toEqual([{ error: failure, pathname: '/error' }]);
  });

  test('hides server-side HTTP exceptions behind the same stable fallback', async () => {
    const error = new HTTPException(500, { message: 'databaseConnectionFailed' });
    const reportedErrors: unknown[] = [];
    const app = createThrowingApp(error, {
      onUnexpectedError: (reportedError) => reportedErrors.push(reportedError),
    });

    const response = await app.request('/error');

    expect(await readJSON<ErrorResponse<HonoErrorCode>>(response)).toEqual({
      kind: 'error',
      status: 500,
      error: 'internalServerError',
    });
    expect(reportedErrors).toEqual([error]);
  });

  test('rejects human-readable exception messages from the public error envelope', async () => {
    const error = new HTTPException(404, { message: 'Record not found' });
    const reportedErrors: unknown[] = [];
    const app = createThrowingApp(error, {
      onUnexpectedError: (reportedError) => reportedErrors.push(reportedError),
    });

    const response = await app.request('/error');

    expect(await readJSON<ErrorResponse<HonoErrorCode>>(response)).toEqual({
      kind: 'error',
      status: 500,
      error: 'internalServerError',
    });
    expect(reportedErrors).toEqual([error]);
  });

  test('rejects exception statuses outside the shared response envelope', async () => {
    const error = new HTTPException(399 as UnofficialStatusCode, { message: 'redirectDetected' });
    const reportedErrors: unknown[] = [];
    const app = createThrowingApp(error, {
      onUnexpectedError: (reportedError) => reportedErrors.push(reportedError),
    });

    const response = await app.request('/error');

    expect(await readJSON<ErrorResponse<HonoErrorCode>>(response)).toEqual({
      kind: 'error',
      status: 500,
      error: 'internalServerError',
    });
    expect(reportedErrors).toEqual([error]);
  });
});

// == RequestLogging ====================================================

describe('loggingMiddleware', () => {
  test('logs method, status, duration, path, and query details', async () => {
    const infoLog = spyOn(log, 'info').mockImplementation(() => undefined);
    const app = new Hono();

    app.use('*', loggingMiddleware);
    app.get('/search', (c) => c.json({ matched: true }));

    const response = await app.request('/search?term=foundation&limit=2');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ matched: true });

    const loggedCall = infoLog.mock.calls[0];
    if (loggedCall === undefined) throw new Error('expectedLoggingCall');
    const [message, service] = loggedCall;

    expect(service).toBe('hono');
    expect(message).toContain('GET');
    expect(message).toContain('200');
    expect(message).toMatch(/\d+ms/);
    expect(message).toContain('/search');
    expect(message).toContain('(term=foundation&limit=2)');
  });

  test('supports custom output, service labels, and body omission', async () => {
    const calls: Array<{ message: string; service: string }> = [];
    const app = new Hono();

    app.use(
      '*',
      createLoggingMiddleware({
        service: 'gateway',
        includeBody: false,
        write: (message, service) => calls.push({ message, service }),
      })
    );
    app.post('/secure', (context) => context.text('accepted'));

    await app.request('/secure', { method: 'POST', body: 'sensitive-body' });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.service).toBe('gateway');
    expect(calls[0]?.message).not.toContain('sensitive-body');
  });

  test('applies configured body preview limits and rejects invalid limits during construction', async () => {
    const messages: string[] = [];
    const app = new Hono();

    app.use('*', createLoggingMiddleware({ bodyPreviewEdgeLength: 3, write: (message) => messages.push(message) }));
    app.post('/body', (context) => context.text('accepted'));

    await app.request('/body', { method: 'POST', body: 'abcdefghij' });

    expect(messages[0]).toContain('abc…hij');
    expect(() => createLoggingMiddleware({ bodyPreviewEdgeLength: 0 })).toThrow('invalidBodyPreviewEdgeLength');
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
      if (typeof name !== 'string') throw new Error('expectedMultipartTextField');
      return c.text(name);
    });

    const formData = new FormData();
    formData.set('name', 'Foundation');
    const response = await app.request('/upload', { method: 'POST', body: formData });

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

// == RequestIdentifiers ===============================================

describe('requestIdMiddleware', () => {
  test('preserves an incoming identifier on the response', async () => {
    const app = new Hono();

    app.use('*', requestIdMiddleware);
    app.get('/health', (context) => context.text('healthy'));

    const response = await app.request('/health', { headers: { 'X-Request-ID': 'request-1' } });

    expect(response.headers.get('X-Request-ID')).toBe('request-1');
  });

  test('generates a missing identifier and exposes it to logging and error reporting', async () => {
    const messages: string[] = [];
    const reportedRequestIds: Array<string | undefined> = [];
    const app = new Hono();

    app.use('*', createRequestIdMiddleware({ createRequestId: () => 'generated-request' }));
    app.use('*', createLoggingMiddleware({ write: (message) => messages.push(message) }));
    app.onError(
      createHonoErrorHandler({
        onUnexpectedError: (_error, _context, requestId) => reportedRequestIds.push(requestId),
      })
    );
    app.get('/error', () => {
      throw new Error('unexpectedFailure');
    });

    const response = await app.request('/error');

    expect(response.headers.get('X-Request-ID')).toBe('generated-request');
    expect(messages[0]).toContain('[generated-request]');
    expect(reportedRequestIds).toEqual(['generated-request']);
  });

  test('supports a custom header and deterministic identifier factory', async () => {
    const app = new Hono();

    app.use('*', createRequestIdMiddleware({ header: 'Trace-ID', createRequestId: () => 'trace-1' }));
    app.get('/health', (context) => context.text('healthy'));

    const response = await app.request('/health');

    expect(response.headers.get('Trace-ID')).toBe('trace-1');
  });

  test('rejects empty identifiers returned by a custom factory', async () => {
    let failure: unknown;
    const app = new Hono();

    app.use('*', createRequestIdMiddleware({ createRequestId: () => '   ' }));
    app.onError((error, context) => {
      failure = error;
      return context.text('failed', 500);
    });
    app.get('/health', (context) => context.text('healthy'));

    const response = await app.request('/health');

    expect(response.status).toBe(500);
    expect(failure).toMatchObject({ name: 'TypeError', message: 'invalidRequestId' });
  });
});
