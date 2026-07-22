# Foundation conventions

These instructions apply recursively across the repository.

Use `README.md` for the complete package architecture and development commands.
Treat this file as the operational style guide for new and modified source code.

Keep every change narrow. Do not rename, reformat, split, or redocument
unrelated code merely because its file was touched. Preserve public behavior
unless the task explicitly authorizes a contract change.

## Architecture

Keep dependencies flowing from specialized modules toward generic foundations:

```text
hono / drizzle / zod-jwt
            ↓
zod-search / zod-bulk / upload
            ↓
http / zod-validation
            ↓
utilities
```

Runtime and type-only imports follow the same direction. Generic utilities
must not depend on framework adapters, and contract modules must not import
their consumers back.

Each module owns one coherent domain. Create another file when a distinct
responsibility exists, not because a file crossed an arbitrary line count.
Avoid vague owners such as `common`, `helpers`, `shared`, or `misc`.

The root `src/index.ts` is the only public package boundary. Do not add module
barrels without a real package subpath. Export every intended public API from
the root index and keep private implementation symbols unexported.

## Files and naming

Use lowercase kebab-case for module directories. Source files repeat the module
name and add a responsibility suffix:

- `*.constants.ts` for immutable runtime collections;
- `*.enums.ts` for literal collections, derived unions, records, and aliases;
- `*.schemas.ts` for Zod schemas and schema factories;
- `*.types.ts` for domain contracts and schema-derived types;
- `*.services.ts` for stateful service classes;
- `*.factory.ts` for non-schema value construction;
- `*.resolvers.ts` for result translation and unwrapping;
- `*.validation.ts` for ordered validation behavior;
- `*.parsing.ts` for input preprocessing;
- `*.refiners.ts` for refinement and narrowing;
- `*.utilities.ts` for stateless reusable behavior;
- `*.execution.ts`, `*.logging.ts`, and `*.respond.ts` for framework concerns;
- `*.spec.ts` for the module's runtime and compile-time specification.

Use PascalCase for exported types and classes. Use precise camelCase verbs for
functions and predicates beginning with `is`, `has`, or `can`. Use
`UPPER_SNAKE_CASE` for immutable configuration and literal collections.

Generic parameters use a `T` prefix and a meaningful noun, such as `TData`,
`TShape`, or `TIdentifier`. Avoid opaque names such as `A`, `B`, or `K` when a
domain name is available.

Enum families follow one colocated model: literal array, derived union, record,
and concise alias. Keep the derived union in `*.enums.ts` beside its runtime
source. When one file owns several enum families, compact named dividers may
separate them without implying a broader file architecture.

## Types and implementation

Use `type` aliases for public contracts. Keep domain types in `*.types.ts` when
that separation communicates ownership. Small utility types that exist only to
describe one cohesive utility may remain beside its implementation; do not
create a tiny type file mechanically.

Simple inline option objects are acceptable when they are local and readable.
Name substantial or independently reusable option contracts with an `Options`
suffix. Name result wrappers with a `Result` suffix when that is their role.

Derive public Zod outputs with `z.infer` or `z.output` instead of manually
duplicating runtime schemas. Preserve transforms, coercion, defaults, strictness,
and literal feature flags in both runtime behavior and emitted declarations.

Declare named behavior with `function`, including exported utilities, schema
factories, and meaningful private helpers. Keep schema values, framework-typed
handler values, configured instances, and public method collections as `const`
when their value identity is the relevant abstraction.

Prefer early returns when they reduce nesting. Keep type assertions narrow and
adjacent to the compiler limitation they solve. Explain why an assertion is
safe when its correctness is not visible from the expression itself.

Imports follow this order:

1. external dependencies;
2. cross-module imports through `@/`;
3. same-module relative imports.

Use `import type` for type-only dependencies and separate import groups with a
blank line.

## Comments

Write comments in English. Keep them accurate and grounded in current runtime
behavior; never document an intended guarantee that the implementation does
not enforce.

Wrap exact identifiers, types, keys, literal values, and code expressions in
backticks. Do not use backticks for ordinary prose, library names, or emphasis.

Do not add ceremonial file headers. Enum collection files may use one balanced
two-line family header when it explains the shared literal model. Elsewhere,
add comments only for context, invariants, ordering, safety boundaries, or
non-obvious decisions; do not narrate straightforward syntax.

Compose consecutive comments as a visually rectangular two-line block:

```ts
// TypeScript cannot connect the generic conditional type with this runtime branch;
// The assertion preserves literal inference without replacing the parsed output;
```

Keep adjacent lines close in length without adding filler or weakening the
meaning. Leave a blank line after a reasoning block when it introduces the next
logical phase.

Group tightly related type helpers under one balanced two-line block comment
when individual JSDoc would only repeat their names. Give independent public
contracts their own JSDoc.

Use wide three-line sections only for real navigation in long files and specs:

```ts
// =====================================================================================================================
// COMPILE-TIME CONTRACTS
// =====================================================================================================================
```

Keep section widths consistent and names uppercase. Do not add sections to
short files merely to manufacture structure.

## JSDoc

Document exported symbols whose behavior is not obvious from their signature.
Public schema factories, services, adapters, configuration types, result types,
and their meaningful public option keys require JSDoc.

Use at least two meaningful description lines of similar visual length. The
first line states responsibility; the second records behavior, a guarantee,
default, or important constraint.

```ts
/**
 * Options for a typed JSON response wrapped in the shared API success envelope.
 * The status generic preserves the literal code inferred by the route contract.
 */
```

Use additional paragraphs only for distinct ideas. Write examples with
`@example`; never wrap JSDoc examples in fenced Markdown blocks. Keep an example
when composition is genuinely easier to understand from a concrete call.

Do not add one-line JSDoc to every trivial helper or derived alias. A precise
shared block comment is better when several adjacent types form one contract.

## Specifications

Each module owns one colocated `<module>.spec.ts`. Keep runtime and compile-time
contracts together rather than creating separate fixtures or type-test files.

Specifications use:

- `test` from `bun:test`, never `it`;
- public imports through `@/index`;
- wide uppercase section dividers;
- local `IsExact` and `Assert` helpers for exact type contracts;
- `@ts-expect-error` for intentionally rejected public shapes;
- deterministic assertions against public behavior.

Cover strictness, defaults, coercion, transforms, failure behavior, and exact
generic inference where they are part of the contract. Test dependency output
through stable public APIs instead of private internals.

## Verification

Run focused checks while implementing, then complete quality assurance before
finishing a module-wide change:

```bash
bun test src/<module>/<module>.spec.ts
bun run typecheck
bun run lint:check
bun run format:check
bun run test
bun run build
git diff --check
```

Inspect the final diff and preserve unrelated user changes. A change to public
generics, schemas, transforms, or exports is incomplete until generated
declarations build successfully and `src/index.ts` exposes the intended API.
