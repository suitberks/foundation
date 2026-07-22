# @kalutskii/foundation

Shared TypeScript foundation for contracts, schemas, framework adapters, and reusable utilities.
The package is designed for Bun, Node.js, and Hono applications.

This repository is not intended to document every exported function through standalone usage snippets.
Public JSDoc, generated declarations, colocated specifications, and editor inference are the API reference.

## Installation

```bash
bun add @kalutskii/foundation
```

```bash
npm install @kalutskii/foundation
```

## Package scope

The package contains several deliberately isolated areas:

| Module           | Responsibility                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `utilities`      | Framework-independent datetime, enum, execution, generation, logging, and type utilities. |
| `http`           | Shared HTTP result contracts, factories, status constants, and result resolvers.          |
| `upload`         | Shared file-format metadata, upload validation, and reusable Zod file schemas.            |
| `zod-validation` | Generic Zod parsing, validation, refinement, and related type utilities.                  |
| `zod-search`     | Reusable search and pagination contracts composed from lower-level Zod primitives.        |
| `zod-bulk`       | Include/exclude selection contracts shared by frontend and backend bulk operations.       |
| `hono`           | Hono-specific response, file response, error handling, and request logging adapters.      |
| `drizzle`        | Drizzle-specific SQL composition that must not leak into generic contract modules.        |
| `zod-jwt`        | JWT service integration with optional Zod validation of decoded payloads.                 |

The root `src/index.ts` is the only public package entrypoint. Internal file paths are implementation details
and should not be imported directly by consumers of `@kalutskii/foundation`.

## Architecture

### Dependency hierarchy

Dependencies must flow from specialized components toward smaller and more generic foundations:

```text
Framework adapters
  hono / drizzle / zod-jwt
            │
            ▼
Contract composition
  zod-search / zod-bulk / upload
            │
            ▼
Contract primitives
  http / zod-validation
            │
            ▼
Generic utilities
  utilities
```

This diagram defines direction, not a requirement for every module to depend on the layer below it.
Independent modules should remain independent instead of introducing artificial shared abstractions.

### Dependency rules

1. Generic utilities must not depend on Hono, Drizzle, JWT services, or application contracts.
2. Generic Zod modules must not acquire hidden framework dependencies through imported helper types.
3. Framework adapters may consume contracts and utilities, but contracts must not import adapters back.
4. Sibling modules should communicate through public concepts instead of reaching into private internals.
5. External dependencies should stay inside the narrowest module that genuinely requires their behavior.
6. Type-only dependencies follow the same architectural rules as runtime dependencies.
7. A reusable abstraction belongs to the lowest layer that can own it without knowing its consumers.

A dependency that appears only in generated declarations is still a real dependency and must be reviewed.
For example, a generic Zod type importing `Simplify` from Drizzle would violate the hierarchy even with no runtime cost.

### Responsibility boundaries

Each module owns one coherent domain. A module may contain several files, but every file must have a narrow role.
Avoid generic dumping grounds such as `common`, `helpers`, `shared`, `misc`, or `stuff` without a concrete domain.

A change belongs in an existing module only when that module can explain and enforce its complete semantics.
Otherwise, create a dedicated module instead of growing an unrelated file with another responsibility.

## Project structure

```text
src/
├── drizzle/
├── hono/
├── http/
├── upload/
├── utilities/
├── zod-bulk/
├── zod-jwt/
├── zod-search/
├── zod-validation/
└── index.ts
```

Modules are directories. Files inside them follow the `<module>.<responsibility>.ts` pattern:

```text
zod-search/
├── zod-search.pagination.schemas.ts
├── zod-search.schemas.ts
├── zod-search.types.ts
└── zod-search.spec.ts
```

Do not add folder barrels unless the package exposes a real subpath for that module. The root barrel remains the
single public API boundary and should export only symbols intentionally supported across package versions.

## File responsibilities

| Suffix            | Expected content                                                              |
| ----------------- | ----------------------------------------------------------------------------- |
| `*.constants.ts`  | Immutable values and literal collections without behavior.                    |
| `*.schemas.ts`    | Runtime Zod schemas and factories whose result is a schema.                   |
| `*.types.ts`      | Type aliases, interfaces, generic contracts, and schema-derived output types. |
| `*.validation.ts` | Ordered validation behavior returning stable domain error keys.               |
| `*.factory.ts`    | Functions whose primary responsibility is constructing non-schema values.     |
| `*.resolvers.ts`  | Functions that unwrap, normalize, or translate an existing result.            |
| `*.utilities.ts`  | Stateless reusable behavior that has no narrower architectural owner.         |
| `*.parsing.ts`    | Input parsing and preprocessing before domain validation.                     |
| `*.refiners.ts`   | Refinement logic that narrows or safely composes an existing value.           |
| `*.execution.ts`  | Framework lifecycle execution and error-boundary behavior.                    |
| `*.logging.ts`    | Logging formatters, sinks, or middleware behavior.                            |
| `*.respond.ts`    | Framework response construction and response-specific contracts.              |
| `*.spec.ts`       | The single colocated runtime and compile-time specification for a module.     |

Do not place TypeScript-only contracts in a schema file when they can be separated without creating a circular
responsibility. Do not split tiny files mechanically either: separation must communicate ownership, not line count.

## Naming conventions

### Files and directories

- Module directories use kebab case: `zod-search`, `zod-validation`.
- Source files repeat the module name and add a responsibility suffix: `http.resolvers.ts`.
- Specifications use the module name and `.spec.ts`: `hono.spec.ts`, `zod-bulk.spec.ts`.
- Avoid names that describe implementation history, temporary state, or vague grouping.

### Runtime symbols

- Zod schema values use the `zod<Name>Schema` form: `zodPaginationSchema`.
- Schema factories keep the same form when the project already treats them as schema constructors.
- Functions use an explicit verb describing their effect: `parseQueryValue`, `generateRandomString`.
- Predicates begin with `is`, `has`, or `can` and must provide a meaningful type guard when possible.
- Constants use `UPPER_SNAKE_CASE` when they represent fixed configuration or enumerated values.
- Boolean options describe capability or state: `queryEnabled`, `paginationEnabled`, `withTime`.

### Type symbols

- Exported types use PascalCase and describe the domain concept instead of its implementation.
- Zod-related public types use the established `Zod<Name>` prefix where it clarifies ownership.
- Option objects end with `Options`; result wrappers end with `Result` when that is their semantic role.
- Generic parameters use a `T` prefix and a meaningful noun: `TShape`, `TIdentifier`, `TQueryEnabled`.
- Literal generic flags should remain literal through `const` generics when they change the returned static shape.

Names should answer what a symbol represents without requiring a reader to inspect its implementation.
Prefer a slightly longer precise name over a short generic name that loses domain meaning.

## TypeScript and code style

The project uses strict TypeScript, ESM, Prettier, and type-aware ESLint. Generated declarations are part of the
public product, so a solution is incomplete when runtime behavior works but emitted types become broad or unstable.

### Imports

1. External dependencies come first.
2. Cross-module project imports use the `@/` alias.
3. Same-module imports use relative paths.
4. Type-only dependencies use `import type`.
5. Import groups are separated by blank lines and left to the configured formatter for sorting.

### General code rules

- Prefer precise types over `any`, broad records, or type assertions that hide lost inference.
- Keep assertions close to the compiler limitation they solve and explain why they are safe.
- Use early returns when they reduce nesting and make exceptional paths visible.
- Separate logical phases with blank lines instead of compressing unrelated operations together.
- Reuse existing project dependencies and abstractions before introducing another package.
- Do not silently swallow unknown fields at public boundaries unless stripping is intentional and documented.
- Do not manually duplicate a runtime schema as an interface that can drift from validation behavior.
- Keep transforms, coercion, defaults, and input/output differences visible in both types and specifications.

### Zod rules

- Runtime schemas are the source of truth; public data types should normally use `z.infer` or `z.output`.
- Accept `z.ZodObject<TShape>` when object methods or exact keys are required by the implementation.
- Do not widen an object schema to `z.ZodType` merely to make a generic signature easier to write.
- Prepared schemas may use explicit escape hatches when transforms or refinements must remain untouched.
- Literal feature flags must alter both runtime shape and inferred output instead of producing vague optional fields.
- API boundary objects should usually be strict so stale or misspelled fields fail loudly.

## Comments

Comments are an intentional part of this codebase. They should make constraints and architectural reasoning easier
to recover later, especially around type-level behavior, validation order, side effects, and framework integration.

### Inline comments

Use inline comments to explain why code exists, what invariant it protects, or why a simpler-looking alternative is
incorrect. Avoid comments that merely translate the following statement into English.

Long files and specifications may use wide visual sections:

```typescript
// ==========================================================================================
// PREPARED SCHEMA COMPOSITION
// ==========================================================================================
```

Keep separator width consistent within the same file. Section names should describe behavior or responsibility,
not generic chronology such as `STEP 1` or `OTHER`.

For local reasoning, prefer two balanced lines that visually form a compact block:

```typescript
// TypeScript cannot connect the generic conditional type with this runtime branch.
// The assertion preserves literal inference without replacing the parsed output type.
```

Leave a blank line after a reasoning block when it introduces the next logical phase. Dense comments should improve
scanning and grouping; they should not turn straightforward code into a narrated transcript.

## JSDoc

Every public symbol with non-obvious behavior should have JSDoc. Public schema factories, services, result types,
configuration types, and framework adapters require documentation before being exported from `src/index.ts`.

The preferred visual style contains at least two meaningful lines of similar length:

```typescript
/**
 * Builds a strict selection contract for bulk operations across paginated data.
 * The identifier schema is shared by explicit and all-matching selection modes.
 */
```

The first line summarizes the responsibility. The second line explains behavior, guarantees, or an important
constraint. Together they should look like a small rectangle instead of one short line followed by a long paragraph.

Additional paragraphs should follow the same principle:

- keep related lines visually balanced;
- separate distinct ideas with an empty JSDoc line;
- document defaults and feature flags next to the affected option;
- explain input/output transforms when runtime and static shapes differ;
- add `@example` only when composition is difficult to understand from the signature;
- avoid copying a full README usage catalog into source comments.

Private symbols benefit from JSDoc when they encode a non-trivial type relationship or architectural invariant.
Simple local values do not need ceremonial comments when their names and implementation are already unambiguous.

## Testing

Each module owns exactly one colocated specification file. Do not create separate schema, utility, integration,
or type fixtures for the same module; runtime and compile-time contracts belong together in `<module>.spec.ts`.

A module specification should contain:

- runtime success paths and meaningful boundary failures;
- strictness, defaults, coercion, transforms, and error behavior where applicable;
- compile-time equality checks for exported generic contracts;
- `@ts-expect-error` assertions for intentionally rejected shapes;
- wide comment sections separating major responsibilities;
- tests through public APIs instead of unstable dependency internals.

Compile-time assertions should use local helper types inside the specification. They must not be exported or moved
into fixture files. Invalid runtime expressions should remain inside uninvoked functions when module evaluation could
otherwise throw before Bun starts the suite.

Tests must remain deterministic:

- freeze or bound time-dependent behavior;
- validate random values by shape rather than exact output;
- avoid relying on terminal-specific ANSI rendering;
- inspect stable public dependency output instead of private object internals;
- compare binary responses byte-for-byte through the standard `Response` API.

Run the focused specification while implementing, then run the complete suite before finishing the change.

## Development workflow

### Prerequisites

- Bun compatible with the version used in CI.
- Node.js only when required by publishing or external tooling.
- `just` is optional but recommended for the project quality-assurance recipe.

### Install dependencies

```bash
bun install
```

Use the frozen lockfile mode in automation:

```bash
bun install --frozen-lockfile
```

### Focused development

```bash
bun test src/<module>/<module>.spec.ts
bun run typecheck
bunx eslint src/<module>
```

Run focused checks first to shorten feedback loops. Do not claim a command passed unless it was actually executed
and completed successfully in the current working tree.

### Full quality assurance

```bash
just quality-assurance
bun run build
git diff --check
```

The `quality-assurance` recipe runs typecheck, lint, formatting, and the complete test suite. Lint and formatting may
modify files, so always inspect the resulting diff and ensure unrelated user work has not been changed.

The build must succeed because `tsup` generates both runtime ESM and public TypeScript declarations. Review declaration
output whenever a change introduces conditional generics, schema factories, transforms, or new exported type aliases.

## Adding or changing a module

Before considering a module change complete:

1. Confirm the responsibility cannot be owned by a smaller existing abstraction.
2. Place files under the correct architectural module and use established suffixes.
3. Keep dependency direction consistent with the hierarchy documented above.
4. Add or update the single colocated module specification.
5. Cover runtime behavior and compile-time inference in that same file.
6. Add balanced JSDoc to every newly exported public symbol.
7. Export the intended API from `src/index.ts`; keep private helpers private.
8. Run focused tests, typecheck, full quality assurance, and declaration build.
9. Inspect `git diff`, `git diff --check`, and generated diagnostics.
10. Update this README only when architecture or development policy changes.

## Public API and releases

The package exposes only the root entrypoint declared in `package.json`. Consumers should import from
`@kalutskii/foundation` and must not depend on `src` paths or generated bundle internals.

A new export is a compatibility commitment. Before publishing it, verify:

- the name follows project conventions;
- the owning module is architecturally correct;
- runtime validation and static inference agree;
- public JSDoc explains defaults and constraints;
- declarations preserve concrete keys, literals, and transformed outputs;
- the module specification protects the intended contract.

Breaking public contracts require an intentional version change and migration plan. Internal refactors should keep
public names and inferred behavior stable unless the release explicitly communicates otherwise.
