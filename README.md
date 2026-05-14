# @kalutskii/foundation

Collection of utilities, types, and helpers for building typed API contracts and responses in TypeScript projects.
Designed for use in Bun/Node.js and Cloudflare Workers environments.

## What this package provides

- Typed API response contracts.
- Response factories for success and failure payloads.
- Safe async resolvers for contract-based fetch functions.
- A Hono helper for typed JSON success responses.
- Utility types/helpers for query parsing and Date serialization.

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

- `SUCCESS_STATUS_CODES`
- `EXCEPTION_STATUS_CODES`

## Usage

### 1. Build typed contracts

```ts
import { failure, success } from '@kalutskii/foundation';
import type { APIContractResult } from '@kalutskii/foundation';

type User = { id: string; name: string };

const ok = success<User>({ status: 200, data: { id: '1', name: 'Kate' } });
const bad = failure({ status: 404, error: 'User not found' });

const result: APIContractResult<User> = Math.random() > 0.5 ? ok : bad;
```

### 2. Resolve fetchers safely

```ts
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

```ts
import { respond } from '@kalutskii/foundation';
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => {
  return respond(c, {
    status: 200,
    data: { ok: true, now: new Date() },
  });
});
```

`respond` returns a typed JSON response contract and includes API error type in route output unions.

### 4. Parse query params with helpers

```ts
import { asQueryBoolean, asQueryNumber } from '@kalutskii/foundation';
import { z } from 'zod';

const pageSchema = asQueryNumber(z.number().int().min(1));
const enabledSchema = asQueryBoolean(z.boolean());

pageSchema.parse('2'); // 2
enabledSchema.parse('yes'); // true
enabledSchema.parse('off'); // false
```

## Exports

The package exports all public APIs from a single entrypoint:

- HTTP constants, schemas, factories, and resolvers.
- Hono `respond` helper.
- Serialization/query utilities, including `SerializeDates`.

## Development

```bash
bun install
bun run lint
bun run typecheck
bun run build
```
