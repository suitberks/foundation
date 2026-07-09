# @kalutskii/foundation

Collection of utilities, types, and helpers for building typed API contracts and responses in TypeScript projects.
Designed for use in Bun/Node.js and Cloudflare Workers environments.

## What this package provides

- Typed API response contracts with success/failure factories and safe resolvers.
- Hono helpers: typed JSON responses, global error handler, request logging middleware.
- Execution utilities: safe async execution and execution time measurement.
- Datetime utilities: timezone-aware formatting helpers.
- Logging utility: unified colored log interface.
- Random string generation utility.
- JWT service with optional Zod schema validation.
- Zod helpers for query param coercion, pagination schemas, nested schema flattening, and type utilities.

## Installation

```bash
bun add @kalutskii/foundation
```

or

```bash
npm i @kalutskii/foundation
```

## Core concepts

Contract shape:

- Success: `{ kind: 'data', status, data }`
- Error: `{ kind: 'error', status, error }`

Status code groups are exported as constants and used by types:

- `SUCCESS_STATUS_CODES` — `[200, 201, 202, 307]`
- `EXCEPTION_STATUS_CODES` — `[400, 401, 403, 404, 405, 409, 500]`

## Usage

### 1. Build typed contracts

```typescript
import { failure, success } from '@kalutskii/foundation';
import type { APIContractResult } from '@kalutskii/foundation';

type User = { id: string; name: string };

const ok = success<User>({ status: 200, data: { id: '1', name: 'Kate' } });
const bad = failure({ status: 404, error: 'User not found' });

const result: APIContractResult<User> = Math.random() > 0.5 ? ok : bad;
```

### 2. Resolve fetchers safely

```typescript
import { fetchAndThrow, fetchSafely } from '@kalutskii/foundation';
import type { APIContractResult } from '@kalutskii/foundation';

type User = { id: string; name: string };

declare function getUser(): Promise<APIContractResult<User>>;

const safe = await fetchSafely(getUser);
if (safe.error) {
  console.error(safe.error);
} else {
  console.log(safe.data.name);
}

try {
  const user = await fetchAndThrow(getUser);
  console.log(user.name);
} catch (error) {
  console.error(error);
}
```

### 3. Use typed Hono JSON responses

```typescript
import { respond } from '@kalutskii/foundation';
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => {
  return respond(c, {
    status: 200,
    data: { ok: true },
  });
});
```

`respond` wraps `c.json` with a typed success payload and includes `APIError` in the route's output union.

### 4. Wire up Hono error handler and logging middleware

```typescript
import { honoLoggingHandler, onHandlerError } from '@kalutskii/foundation';
import { Hono } from 'hono';

const app = new Hono();

app.use('*', honoLoggingHandler);
app.onError(onHandlerError);
```

`onHandlerError` catches all thrown errors, maps `HTTPException` (< 500) to their status codes, and returns a generic 500 with a unique error ID for unexpected errors.

`honoLoggingHandler` logs each request with method, status, duration, path, and query params.
Example: `[12:12:12 (+4 UTC)] hono         | POST 200    123ms /api/v1/users (search=term)`

### 5. Execute functions safely and measure performance

```typescript
import { measureExecutionTime, safeExecute } from '@kalutskii/foundation';

const result = await safeExecute(
  () => fetchData(),
  (error) => console.error(error)
);

const { result: data, executionTime } = await measureExecutionTime(() => fetchData());
console.log(`Done in ${executionTime}ms`);
```

### 6. Parse query params with `asQuery`

```typescript
import { asQuery } from '@kalutskii/foundation';
import { z } from 'zod';

const schema = z.object({
  page: asQuery(z.number().int().positive()),
  isActive: asQuery(z.boolean()),
});

schema.parse({ page: '2', isActive: 'true' }); // { page: 2, isActive: true }
```

`asQuery` preprocesses string values from query parameters — coercing `'true'`/`'false'` to booleans and numeric strings to numbers — before passing them to the Zod schema for validation.

### 8. Build flat query schemas from nested objects

```typescript
import { asQuerySchema } from '@kalutskii/foundation';
import { z } from 'zod';

const schema = asQuerySchema(
  z.object({
    search: z.string().optional(),
    sort: z
      .object({
        field: z.string(),
        order: z.enum(['asc', 'desc']),
      })
      .optional(),
  })
);

schema.parse({ search: 'foo', field: 'name', order: 'asc' });
// { search: 'foo', field: 'name', order: 'asc' }

// Rejects the original nested structure
schema.parse({ sort: { field: 'name', order: 'asc' } }); // throws
```

`asQuerySchema` flattens nested `z.object(...)` fields to the top level, making it suitable for flat query parameter validation. Nested object fields are lifted, while optionality is preserved: required parents keep their fields required, optional parents make all promoted fields optional. The result is a strict schema (unknown keys are rejected).

### 8. Use pagination schema

```typescript
import { refinePagination, zodPaginationSchema, zodPaginationShape } from '@kalutskii/foundation';
import { z } from 'zod';

// Use as a standalone schema
const options = zodPaginationSchema.parse({ offset: '0', limit: '20' });
// { offset: 0, limit: 20 }

// Spread shape into a larger query schema
const querySchema = z.object({
  search: z.string().optional(),
  ...zodPaginationShape,
});

// Strip undefined pagination values before passing to a query builder (e.g. Drizzle)
await db.query.users.findMany({
  ...refinePagination(options),
});
```

### 9. Work with JWT using `ZodJWTService`

```typescript
import { ZodJWTService } from '@kalutskii/foundation';
import { z } from 'zod';

const payloadSchema = z.object({ userId: z.string() });
const jwt = new ZodJWTService(payloadSchema, { defaultExpirationSeconds: 3600 });

const token = await jwt.sign({ userId: '42' }, 'secret');
const payload = await jwt.verifyOrThrow(token, 'secret');
// payload: { userId: '42', exp: ... }

// decode without throwing (returns null on invalid token or schema mismatch)
const decoded = await jwt.decode(token);
```

### 10. Datetime helpers

```typescript
import { formatTime, getFormattedDate, getFormattedTime, getZonedTime } from '@kalutskii/foundation';

getFormattedTime({ tz: 'Europe/Moscow' }); // '15:30:00 (+3 UTC)'
getFormattedDate({ tz: 'Europe/Moscow' }); // '22.06.2026 15:30:00 (+3 UTC)'
getFormattedDate({ tz: 'Europe/Moscow', withTime: false }); // '22.06.2026'
formatTime(new Date(), { tz: 'Europe/Moscow' }); // '15:30:00, 22 июня 2026 (+3 UTC)'
```

### 11. Logging

```typescript
import { log } from '@kalutskii/foundation';

log.info('Server started', 'app');
log.warn('Deprecated call', 'auth');
log.error('Something failed', 'db', error.stack);
// [15:30:00 (+3 UTC)] app          | Server started
```

## Exports

The package exports all public APIs from a single entrypoint:

- **HTTP**: `success`, `failure`, `fetchSafely`, `fetchAndThrow`, constants, schemas.
- **Hono**: `respond`, `onHandlerError`, `honoLoggingHandler`.
- **Utilities**: `safeExecute`, `measureExecutionTime`, `generateRandomString`, `log`, `getColoredHTTPStatus`, datetime helpers.
- **Zod JWT**: `ZodJWTService`.
- **Zod Pagination**: `zodPaginationSchema`, `zodPaginationShape`, `refinePagination`, `ZodPaginationOptions`.
- **Zod Flatten**: `asQuerySchema`, `flattenZodShape`, `isZodObject`, `isZodOptional`, `unwrapOptional`, `FlattenZodShape`.
- **Zod Validation**: `asQuery`, `AsQuery`, `AtLeastOne`.
- **Type Utilities**: `Simplify`.

## Development

```bash
bun install
bun run lint
bun run typecheck
bun run build
```
