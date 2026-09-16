import { describe, expect, test } from 'bun:test';

import { type Context, Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { UnofficialStatusCode } from 'hono/utils/http-status';

import {
  type ErrorResponse,
  type HonoErrorCode,
  type HonoErrorHandlerOptions,
  type HonoFileRespondOptions,
  type HonoRespondOptions,
  type SuccessResponse,
  createHonoErrorHandler,
  fileRespond,
  honoErrors,
  respond,
} from '@/index';

// These tests cover Hono response envelopes, file downloads, and global error handling behavior;
// They preserve exact public contracts, binary content, stable failures, and reporting boundaries;

// == CompileTimeContracts ==============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _HonoErrorCodeContract = Assert<IsExact<HonoErrorCode, 'internalServerError'>>;
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
  IsExact<HonoErrorHandlerOptions, { onUnexpectedError: (error: unknown, context: Context) => void }>
>;

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

// == JSONResponses ======================================================

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

  test('passes explicitly cast unofficial success statuses through Hono', async () => {
    const app = new Hono();

    app.get('/custom', (context) => respond(context, { status: 299 as UnofficialStatusCode }));

    expect((await app.request('/custom')).status).toBe(299);
  });
});

// == FileResponses ======================================================

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

// == ErrorHandling ======================================================

describe('honoErrors', () => {
  test('creates a stable machine-readable internal server failure', () => {
    const error = honoErrors.internalServerError();

    expect(error).toBeInstanceOf(HTTPException);
    expect(error.status).toBe(500);
    expect(error.message).toBe('internalServerError');
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

  test('passes explicitly cast unofficial client error statuses through Hono', async () => {
    const reportedErrors: unknown[] = [];
    const app = createThrowingApp(new HTTPException(499 as UnofficialStatusCode, { message: 'customClientFailure' }), {
      onUnexpectedError: (error) => reportedErrors.push(error),
    });

    const response = await app.request('/error');

    expect(response.status).toBe(499);
    expect(await readJSON<ErrorResponse>(response)).toEqual({
      kind: 'error',
      status: 499 as UnofficialStatusCode,
      error: 'customClientFailure',
    });
    expect(reportedErrors).toEqual([]);
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
