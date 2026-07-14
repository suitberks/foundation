import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { APIError, APISuccess } from '@/http/http.schemas';
import { log } from '@/utilities/logging.utilities';

import { onHandlerError } from './hono.execution';
import { honoLoggingHandler } from './hono.logging';
import { fileRespond, respond } from './hono.respond';

/**
 * Reads a JSON response while keeping each test explicit about the public payload it expects.
 * The cast is isolated here because the Web Response API exposes parsed JSON without domain typing.
 */
async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

/**
 * Creates the smallest real Hono application that exercises the registered global error handler.
 * A fresh app per assertion prevents routes and middleware state from leaking between tests.
 */
function createThrowingApp(error: unknown): Hono {
  const app = new Hono();

  app.onError(onHandlerError);
  app.get('/error', () => {
    throw error;
  });

  return app;
}

afterEach(() => {
  mock.restore();
});

// =================================================================================================
// TYPED JSON RESPONSES THROUGH REAL HONO REQUESTS
// =================================================================================================

describe('respond', () => {
  it('returns the requested status and wraps data in the API success envelope', async () => {
    const app = new Hono();

    app.post('/users', (c) => respond(c, { status: 201, data: { id: 'user-1' } }));

    const response = await app.request('/users', { method: 'POST' });

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await readJson<APISuccess<{ id: string }>>(response)).toEqual({
      kind: 'data',
      status: 201,
      data: { id: 'user-1' },
    });
  });

  it('uses an empty object when optional response data is omitted', async () => {
    const app = new Hono();

    app.get('/accepted', (c) => respond(c, { status: 202 }));

    const response = await app.request('/accepted');

    expect(response.status).toBe(202);
    expect(await readJson<APISuccess<Record<string, never>>>(response)).toEqual({
      kind: 'data',
      status: 202,
      data: {},
    });
  });
});

// =================================================================================================
// FILE DOWNLOAD RESPONSES
// =================================================================================================

describe('fileRespond', () => {
  it('returns the requested binary content with attachment and custom content-type headers', async () => {
    const app = new Hono();
    const content = new TextEncoder().encode('identifier,name\nasset-1,Foundation').buffer;

    app.get('/assets.csv', (c) =>
      fileRespond(c, {
        status: 200,
        content,
        filename: 'assets.csv',
        contentType: 'text/csv; charset=utf-8',
      })
    );

    const response = await app.request('/assets.csv');

    // Headers describe a downloadable attachment, while the body remains byte-for-byte identical to the source buffer.
    // Reading through the Web Response API verifies the real Hono integration instead of a mocked Context interaction.
    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="assets.csv"');
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(content));
  });

  it('uses the binary content type by default and preserves arbitrary bytes', async () => {
    const app = new Hono();
    const content = new Uint8Array([0, 1, 127, 128, 255]).buffer;

    app.get('/archive.bin', (c) =>
      fileRespond(c, {
        status: 201,
        content,
        filename: 'archive.bin',
      })
    );

    const response = await app.request('/archive.bin');

    // The fallback media type must remain deterministic for unknown formats and generated binary exports.
    // Non-text bytes guard against accidental encoding, JSON serialization, or UTF-8 conversion in the response path.
    expect(response.status).toBe(201);
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="archive.bin"');
    expect(response.headers.get('content-type')).toBe('application/octet-stream');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(content));
  });
});

// =================================================================================================
// GLOBAL ERROR HANDLING
// =================================================================================================

describe('onHandlerError', () => {
  it('preserves expected client HTTP exceptions without logging them as unhandled', async () => {
    const errorLog = spyOn(log, 'error').mockImplementation(() => undefined);
    const app = createThrowingApp(new HTTPException(404, { message: 'Record not found' }));

    const response = await app.request('/error');

    expect(response.status).toBe(404);
    expect(await readJson<APIError>(response)).toEqual({
      kind: 'error',
      status: 404,
      error: 'Record not found',
    });
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('returns a traceable generic 500 response and logs the matching generated error id', async () => {
    const errorLog = spyOn(log, 'error').mockImplementation(() => undefined);
    const app = createThrowingApp(new Error('Database unavailable'));

    const response = await app.request('/error');
    const body = await readJson<APIError>(response);
    const errorMatch = /^Internal server error \| ([A-Za-z0-9]{6})$/.exec(body.error);

    expect(response.status).toBe(500);
    expect(body.kind).toBe('error');
    expect(body.status).toBe(500);
    expect(errorMatch).not.toBeNull();

    // The random value itself is intentionally not fixed; only its format and correlation are deterministic.
    if (!errorMatch) throw new Error('The 500 response did not contain a valid error id');
    const errorId = errorMatch[1]!;

    expect(errorLog).toHaveBeenCalledTimes(1);
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('Database unavailable'), errorId);
  });
});

// =================================================================================================
// REQUEST LOGGING MIDDLEWARE
// =================================================================================================

describe('honoLoggingHandler', () => {
  it('continues the request and logs stable method, status, path, and query details', async () => {
    const infoLog = spyOn(log, 'info').mockImplementation(() => undefined);
    const app = new Hono();

    app.use('*', honoLoggingHandler);
    app.get('/search', (c) => respond(c, { status: 200, data: { matched: true } }));

    const response = await app.request('/search?term=foundation&limit=2');
    const body = await readJson<APISuccess<{ matched: boolean }>>(response);

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ matched: true });
    expect(infoLog).toHaveBeenCalledTimes(1);

    const loggedCall = infoLog.mock.calls[0];
    if (!loggedCall) throw new Error('The request logger did not emit its expected call');
    const [message, service] = loggedCall;

    // Duration is deliberately checked only by shape because wall-clock measurements are nondeterministic.
    expect(service).toBe('hono');
    expect(message).toContain('GET');
    expect(message).toContain('200');
    expect(message).toMatch(/\d+ms/);
    expect(message).toContain('/search');
    expect(message).toContain('(term=foundation&limit=2)');
  });
});
