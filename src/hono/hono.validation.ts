import type { ValidationTargets } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { validator } from 'hono/validator';
import type { z } from 'zod';

import { honoErrors } from './hono.errors';
import type { HonoLimitedValidatorOptions, HonoQueryValidatorOptions, HonoValidatorOptions } from './hono.types';

/**
 * Creates asynchronous Zod validation for one supported Hono request target.
 * Successful output remains available with its inferred type through `context.req.valid()`.
 */
export function createHonoValidator<TSchema extends z.ZodType, TTarget extends keyof ValidationTargets>(
  options: HonoValidatorOptions<TSchema, TTarget>
) {
  const { target, schema, createValidationError } = options;

  return validator(target, async (value): Promise<z.output<TSchema>> => {
    const result = await schema.safeParseAsync(value);

    if (result.success) return result.data;
    throw createValidationError();
  });
}

/**
 * Creates Zod body validation guarded by Hono's streaming byte-size limiter.
 * Oversized bodies fail before parsing while accepted output retains schema inference.
 */
export function createLimitedHonoValidator<TSchema extends z.ZodType, TTarget extends 'form' | 'json'>(
  options: HonoLimitedValidatorOptions<TSchema, TTarget>
) {
  const { maxSize, createBodyTooLargeError, ...validatorOptions } = options;

  const isInvalidBodyLimit = Number.isSafeInteger(maxSize) === false || maxSize < 1;

  // ↓ Reject invalid static policy before constructing either reusable middleware.

  if (isInvalidBodyLimit) {
    throw honoErrors.invalidBodyLimit();
  }

  const limitBody = bodyLimit({
    maxSize,
    onError: () => {
      throw createBodyTooLargeError();
    },
  });

  const validateBody = createHonoValidator(validatorOptions);
  const validateLimitedBody: typeof validateBody = async (context, next) => {
    await limitBody(context, async () => {
      await validateBody(context, next);
    });
  };

  return validateLimitedBody;
}

/**
 * Creates Zod validation for Hono's standard flat query representation.
 * Nested parsing stays excluded while schemas retain coercion and transformation control.
 */
export function createQueryValidator<TSchema extends z.ZodType>(options: HonoQueryValidatorOptions<TSchema>) {
  return createHonoValidator({ target: 'query', ...options });
}
