import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { red } from 'kleur/colors';

import { failure } from '@/http/http.factory';
import type { APIError, ExceptionStatusCode } from '@/http/http.types';
import { generateRandomString } from '@/utilities/generation.utilities';
import { log } from '@/utilities/logging.utilities';

function proceedUnhandledError(error: unknown): APIError {
  // Unexpected failures receive a correlation ID shared by logs and the response;
  // Internal error details remain server-side while callers get a generic message;

  const errorId = generateRandomString(6);
  const errorMessage = error instanceof Error ? (error.stack ?? error.message) : JSON.stringify(error);

  log.error(`Unhandled error: ${red(errorMessage)}`, errorId);
  return failure({ status: 500, error: `Internal server error | ${errorId}` });
}

/**
 * Converts expected `HTTPException` values into shared API error envelopes.
 * Unexpected failures are logged and represented by a traceable generic response.
 */
export const onHandlerError: ErrorHandler = (error, c) => {
  let response: APIError;

  if (error instanceof HTTPException && error.status < 500) {
    response = failure({ status: error.status as ExceptionStatusCode, error: error.message });
  } else response = proceedUnhandledError(error);

  return c.json(response, response.status);
};
