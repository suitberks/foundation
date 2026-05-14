import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { red } from 'kleur';

import { failure } from '@/http/http.factory';
import type { APIError, ExceptionStatusCode } from '@/http/http.schemas';
import { generateRandomString } from '@/utilities/generation.utilities';
import { log } from '@/utilities/logging.utilities';

function proceedUnhandledError(error: unknown): APIError {
  // Handles unrecognized errors by logging them with a unique ID and
  // returning a generic 500 response with the error ID for reference.

  const errorId = generateRandomString(6);
  const errorMessage = error instanceof Error ? error.message + error.stack : JSON.stringify(error);

  log.error(`Unhandled error: ${red(errorMessage)}`, errorId);
  return failure({ status: 500, error: `Internal server error | ${errorId}` });
}

/**
 * Global error handler for Hono framework. Catches all exceptions thrown in route handlers and middlewares.
 * Distinguishes between expected HTTPExceptions (mapped to their status codes) and unexpected errors (500).
 */
export const onHandlerError: ErrorHandler = (error, c) => {
  let response: APIError;

  if (error instanceof HTTPException && error.status < 500) {
    response = failure({ status: error.status as ExceptionStatusCode, error: error.message });
  } else response = proceedUnhandledError(error);

  return c.json(response, response.status);
};
