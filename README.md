# @kalutskii/foundation

Shared TypeScript foundations for reusable contracts, validation, framework adapters, and utilities.
Designed for Bun, Node.js, Hono, Drizzle ORM, and Zod applications.

## Installation

```bash
bun add @kalutskii/foundation
```

## Modules

- **Generic:** `base64`, `datetime`, `execution`, `object`, `random`, `string-enum`, `type`.
- **Contracts:** `response`, `upload`, `zod`.
- **Security:** `hmac`, `jwt`.
- **Adapters:** `drizzle`, `hono`, `logging`.

All supported APIs are exported from the package root. Generated declarations, public JSDoc, and colocated
specifications are the API reference; internal source paths are not public entrypoints.

## Development

```bash
bun install
just qa
bun run build
```

`just qa` runs type checking, linting, formatting, and the complete Bun test suite. Repository architecture and
source conventions are documented in [`AGENTS.md`](./AGENTS.md).
