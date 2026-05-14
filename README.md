# @esb-market-contracts/core

Shared TypeScript HTTP contracts and response factories for consistent API communication across esb-market-space services.

## Overview

This package provides shared HTTP contract primitives used across services in the ecosystem:

- response contract types
- small factory helpers
- contract resolver helpers
- shared status-code constants

The goal is to keep API response handling consistent between backend and frontend projects while preserving strong TypeScript typing.

## Installation

```bash
bun add @kalutskii/foundation
```

## Usage

```ts
import type { APIError, APISuccess, APIVoidSuccess } from '@esb-market-contracts/core';
import { failure, success, voidSuccess } from '@esb-market-contracts/core';

// Successful response with data
const response: APISuccess<User> = success({ status: 200, data: user });

// Successful response without data
const created: APIVoidSuccess = voidSuccess({ status: 201 });

// Error response
const error: APIError = failure({ status: 404, error: 'User not found' });
```

## Typical usage pattern

```ts
import type { APIContractResult } from '@esb-market-contracts/core';
import { resolveAPIContract, withResolveAPIContract } from '@esb-market-contracts/core';

declare function getUser(): Promise<APIContractResult<{ id: string; name: string }>>;

const fetchUser = withResolveAPIContract(getUser);

try {
  const user = await fetchUser();
  console.log(user.name);
} catch (error) {
  // error is a typed APIError contract object
  console.error(error);
}

// or resolve directly from an awaited response
const user = resolveAPIContract(await getUser());
```

## API surface

The package exports contracts, helper types, constants, factories, and resolver utilities from a single entry point.

Use your editor IntelliSense or type definitions for the exact up-to-date API list.

## Development

```bash
bun install
bun run typecheck
bun run build
```

## Git flow and releases

This repository uses a simple trunk-based flow.

1. Create a feature branch from `main`.
2. Open a PR and merge into `main`.
3. Bump `version` in `package.json` before merge or in the merge commit.
4. Push to `main`.
5. GitHub Actions builds and publishes automatically if this version does not yet exist on npm.

No release tags are required for publishing.

## CI publish flow

- Workflow: `.github/workflows/publish.yml`
- Trigger: push to `main` or manual `workflow_dispatch`
- Publish secret source: GitHub Environment `esb-market-contracts-environment`
- Required secret: `NPM_TOKEN`

The workflow logic:

1. Installs dependencies with Bun.
2. Runs typecheck and build.
3. Reads package `name` + `version`.
4. Checks npm registry for the same version.
5. Publishes only when that version is not already published.

## Notes

- Keep this README high-level.
- Treat source code and type definitions as the single source of truth for exact runtime/type behavior.
