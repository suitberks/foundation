# Foundation conventions

These instructions apply recursively across the repository. Use `README.md`
for the current package architecture, module inventory, and development commands.
Treat this file as the operational style guide for every new or modified source.

Keep each change narrow and preserve unrelated local work. Do not rename,
reformat, split, or redocument adjacent code merely because its file was touched.
Preserve public behavior unless the task explicitly authorizes a contract change.

## Change boundaries

Change one coherent module at a time. Read its implementation, specification,
exports, dependency direction, and real consumers before changing its public
surface or adding utilities. Preserve unrelated code and public behavior unless
the task explicitly corrects a verified safety or correctness problem.

Do not manufacture APIs to make a module look complete. A new public primitive
must encode a repeated invariant, remove unsafe machinery, protect a dangerous
boundary, or serve an observed consumer. Prefer leaving a small module small.

When a change introduces a behavior difference, document and test the exact reason.
Examples include correcting SQL null semantics, rejecting an unsafe runtime key,
or preventing a callback whose result can no longer affect execution.

## Architecture and files

Each module owns one coherent domain. Split files by responsibility rather than
line count, and avoid vague owners such as `common`, `shared`, `helpers`, or
`misc`. Use the established responsibility suffixes consistently:

- `*.constants.ts` for immutable configuration and meaningful defaults;
- `*.enums.ts` for literal collections, unions, records, and aliases;
- `*.errors.ts` for complete error registries and derived code unions;
- `*.types.ts` for reusable domain and public contracts;
- `*.schemas.ts` for runtime schemas and schema factories;
- `*.factory.ts` for non-schema value construction;
- `*.presets.ts` for ready-to-use policies composed from public values;
- `*.resolvers.ts` for result translation and unwrapping;
- `*.validation.ts` for ordered validation behavior;
- `*.parsing.ts` for input preprocessing and normalization;
- `*.refiners.ts` for refinement, narrowing, and condition construction;
- `*.utilities.ts` for cohesive stateless reusable behavior;
- `*.services.ts` for stateful service classes;
- `*.measurements.ts` for execution timing contracts and measurement behavior;
- `*.retry.ts` and `*.timeout.ts` for bounded execution policies;
- `*.execution.ts`, `*.logging.ts`, and `*.respond.ts` for framework concerns;
- `*.request-id.ts` and `*.security.ts` for their narrow cross-cutting concerns;
- `*.spec.ts` for the module's runtime and compile-time specification;
- `index.ts` for the module's public barrel.

Create a separate file when a distinct responsibility exists. Do not extract a
tiny function mechanically when it cannot be understood, reused, or tested
outside the operation whose invocation state it closes over.

Dependencies continue flowing from specialized adapters toward generic modules.
Runtime and type-only imports follow the same direction. A generic module must
not import its framework consumer or application-specific translation layer.

Keep the repository dependency hierarchy aligned with the current package architecture:

```text
Framework adapters
  hono / drizzle / jwt
            ↓
Contract composition
  upload
            ↓
Contract primitives
  response / logging / zod
            ↓
Generic foundations
  base64 / datetime / object / random / string-enum / type
```

Independent modules may skip layers, but dependencies must never point upward.

## Public boundaries and barrels

Every module owns one local `index.ts`. Export all intended package APIs
from that barrel and expose the barrel once through `src/index.ts`. Do not make
the root index repeat the module's internal file layout.

Export a helper when it forms a meaningful standalone contract. Do not leave a
reusable timer, policy default, error registry, schema factory, or public domain
type undocumented and private merely because its first caller is nearby.

Keep invocation-bound callbacks private. Listeners, promise rejectors, and small
closures that depend on one function call's local state are implementation
details and must not be exported artificially.

Private validation may remain accessible between files in one module without
being exported from its barrel. Barrel inclusion is the explicit package API
decision, not a mechanical list of every declaration in the directory.

## Naming and declarations

Use PascalCase for exported types and classes, precise camelCase verbs for
functions, and `UPPER_SNAKE_CASE` for immutable configuration. Predicates begin
with `is`, `has`, or `can` when those words describe their result accurately.

Generic parameters use `T` plus a meaningful noun: `TData`, `TTable`, `TShape`,
or `TIdentifier`. Avoid opaque names when the domain provides a useful one.

Declare named reusable behavior with `function`. Keep configured instances,
schema values, registries, framework-typed handlers, and literal collections as
`const` where value identity is the relevant abstraction.

Keep function signatures readable. When a defaulted options object has several
properties or makes the declaration visually dense, accept a named `options`
parameter and destructure it at the beginning of the function body. Keep inline
parameter destructuring only while the complete signature remains effortless to
scan.

Order declarations dependency-first within each file. Place foundational types,
constants, predicates, and low-level helpers before the declarations that consume
them. For independent declarations, preserve the clearest public reading order;
do not replace semantic grouping with mechanical alphabetical sorting.

Apply the same ordering to type contracts. Declare primitive and foundational
contracts before composed, conditional, or result types that reference them.
Inside classes, keep the public API before private implementation details unless
moving a private member materially clarifies a non-obvious dependency.

Use `type` aliases for public contracts. Derive types from their runtime source
or authoritative dependency model whenever possible instead of reproducing the
same keys and values manually.

Shared type-level transformations belong to the generic `type` module. Export
every meaningful stage used to compose a public utility, document non-obvious
types with balanced two-line JSDoc, and add a compact `@example` when the
resulting shape is easier to understand from one concrete alias.

## Zod contracts

Treat runtime schemas as the source of truth and derive public outputs with
`z.infer` or `z.output`. Preserve coercion, transforms, defaults, strictness,
and input/output differences in both runtime behavior and emitted declarations.

Accept `z.ZodObject<TShape>` when object methods or exact keys are required.
Do not widen an object schema merely to simplify a generic signature. Public
boundary objects should usually remain strict so stale or misspelled fields fail
instead of disappearing silently.

## Imports

Order imports as external dependencies, cross-module `@/` imports, then relative
same-module imports. Separate groups with one blank line. Use `import type` for
type-only dependencies and combine imports only when the result remains clear.

Cross-module imports target the owning local barrel, such as `@/type`, and never
reach into implementation files such as `@/type/type.utilities`. Files within
one module import their siblings through relative paths. Specifications import
the supported package contract exclusively through `@/index`.

Do not hide dependency cycles behind barrel imports. Resolve a cycle by restoring
the correct responsibility boundary rather than bypassing the barrel with a deep
path or routing internal production code through the package root.

## Errors

Project-owned thrown and validation errors expose stable camelCase codes, never
human-readable messages. Applications own translated or displayable copy. An
error registry contains complete factories, not only a parallel code catalog.

Every registry starts with this exact two-line header. Replace only `{Entity}`
while preserving the wording and punctuation:

```ts
// Specific errors describing failure scenarios for `{Entity}`-related operations;
// Used by the owning module to communicate stable and machine-readable failures;
```

Registry keys and emitted error messages use the same camelCase code. Factories
also own the concrete error class, status, standard platform name, and structured
metadata when those are part of the module contract.

Derive the public error-code union directly from the registry keys. Never repeat
its literals manually. Place this exact zone comment above the alias, replacing
only `{entity}` with the camelCase registry owner:

```ts
// ↓ Inferred literal union of error codes from `{entity}Errors`;
```

Do not add sentences, punctuation, prefixes, or implementation details to error
messages. Do not embed translated validation text inside low-level predicates or
schemas. Preserve external dependency errors only when they are intentionally
part of the public contract; otherwise translate them at the owning boundary.

## Constants

Important constants require a meaningful rectangular two-line JSDoc regardless
of whether the module barrel exposes them. The first line states the represented
policy; the second explains its boundary, default behavior, units, or
interpretation.

```ts
/**
 * Default total attempt count applied when no explicit retry limit is provided.
 * The value includes the initial operation and every subsequent retry attempt.
 */
export const DEFAULT_RETRY_MAX_ATTEMPTS = 3;
```

Simple constants needing only a short clarification use a trailing left-arrow
comment. Do not inflate them into JSDoc or move the comment above the declaration:

```ts
export const EXAMPLE_NON_IMPORTANT = 5; // ← Short contextual explanation.
```

Do not comment a constant whose name and literal already communicate everything.

## Enums

Every enum collection file starts with this exact two-line header.
Replace only `{Entity}` with the owning module entity while preserving wording:

```ts
// `{Entity}` enums define supported literal collections and synchronized public aliases;
// Derived unions and records preserve one authoritative source for every enum family;
```

Keep each enum family colocated as its readonly literal array, derived union,
immutable record, and concise alias. Introduce the record pair with this exact
comment, replacing only `{Entity}` with the concrete enum family entity:

```ts
// ↓ Descriptive and concise aliases share one immutable `{Entity}` record;
```

Use a compact named divider when one file owns several enum families. Do not
repeat family values manually in unions, records, aliases, or documentation.

## JSDoc

Document non-obvious exported functions, types, services, schemas, adapters, and
important constants. Use at least two meaningful description lines of similar
visual length. The first states responsibility; the second records behavior, a
guarantee, default, failure mode, unit, or safety boundary.

Do not write one-line JSDoc. Do not narrate a signature, repeat a symbol name, or
add ceremonial documentation to trivial derived aliases. Use grouped ordinary
comments when several adjacent helpers form one inseparable internal contract.

Document meaningful public option properties when their units, defaults,
interaction, or cancellation semantics are not obvious from the property type.

Use `@example` only when concrete composition materially improves understanding.
Never wrap JSDoc examples in fenced Markdown blocks.

Specifications contain no JSDoc. Test-local functions, tables, fixtures, and
compile-time helpers either use a short ordinary comment when genuinely needed
or remain uncommented when their names and placement are already sufficient.

## Ordinary comments

Write comments in English and describe current enforced behavior. Wrap exact
identifiers, keys, types, literals, and expressions in backticks. Do not use
comments as prose decoration or narrate straightforward syntax.

Outside functions, use balanced two-line comments for real context, invariants,
or ownership. Keep adjacent lines visually close without adding filler or
weakening their meaning.

Inside functions, comments explain only non-obvious ordering, typing, cleanup,
cancellation, resource ownership, or safety. Every inline comment ends with a
period.

Choose comment geometry from its semantic target, not from comment length or
the visual length of the following expression. A comment targeting an entire
multi-line control-flow block or a sequence of operations uses `↓` and exactly
one blank line before that block:

```ts
// ↓ Release every timer and cross-signal listener after settlement.

clearTimeout(timeout);
signal.removeEventListener('abort', onAbort);
```

A multi-line `if`, loop, `try`, or similar construct counts as a block when the
comment explains the construct as a whole. Place the arrow directly before the
construct, even when its body only throws one error:

```ts
// ↓ Reject malformed signatures before passing them to the native decoder.

if (signature.length % 2 !== 0 || HEX_SIGNATURE_PATTERN.test(signature) === false) {
  throw hmacErrors.invalidHexSignature();
}
```

When a comment explains one specific statement, omit the arrow and keep it
directly adjacent without a blank line. This includes one-line guards and single
declarations whose expressions happen to wrap across several visual lines:

```ts
// Preserve the original failure and its stack trace.
throw error;

// Preserve an explicitly disabled retry policy.
if (maxAttempts === 0) return;
```

If one compiler limitation or safety invariant motivates several declarations,
checks, or operations, the comment targets their complete sequence and therefore
uses the block form. Do not classify it from the first statement alone.

When only one decision inside a larger construct needs explanation, place the
comment at that decision instead of describing the entire outer construct:

```ts
try {
  return decodeSignature(signature);
} catch {
  // Treat malformed external signatures as failed verification.
  return false;
}
```

Prefer one concise line. Use a rectangular multi-line reasoning block only when
one line cannot remain accurate and clear. Do not prefix every line of one block
with a separate arrow.

## Implementation and safety

Prefer early returns when they expose terminal states and reduce nesting. Keep
assertions narrow and adjacent to the compiler limitation they solve. Explain
why an assertion is safe only when the reason is not visible from its expression.

Do not use the unary `!` operator. Compare negative boolean predicates with
`=== false`, use explicit nullish comparisons, and keep positive checks direct.
Names must describe the resulting boolean state rather than forcing a reader to
mentally negate the underlying expression.

Use an authoritative dependency API instead of casting an entire foreign object
to an unrelated record. If the JavaScript standard library erases known keys or
entries, restore only the narrow relation the type system lost.

Extract a dense or multi-clause boolean expression into a positively named local
constant before using it for control flow. The name must state the resulting
condition, not merely repeat one operand or force the reader to negate the
expression mentally.

Validate static policy before starting work. Validate dynamically resolved
policy before allocating its resource. Reject invalid runtime data even when
TypeScript normally prevents it, because JavaScript and explicit assertions can
cross public package boundaries.

Preserve original failures when a wrapper has no explicit translation contract.
Avoid hidden promise rejections, unreachable fallback throws, unsafe non-null
assertions, and cleanup paths that depend on only successful completion.

Cancellation preserves the caller's exact reason. Pre-aborted signals prevent
work from starting. Timers and listeners are released on every settlement path
so completed work cannot retain resources or be aborted afterwards.

For database helpers, preserve SQL semantics rather than merely satisfying the
builder types. Empty mutation predicates must fail closed, `undefined` may mean
omitted, falsy values remain defined, and `null` uses the database's null-aware
operator rather than ordinary equality.

## Specifications

Each module owns one colocated `<module>.spec.ts` combining runtime and
compile-time public contracts. Import tested APIs through `@/index`, use `test`
from `bun:test`, and assert deterministic public behavior rather than internals.

Start with one balanced two-line description of the specification. Organize real
behavioral groups with concise balanced dividers:

```ts
// These tests describe the public behavior covered by this module specification;
// They preserve exact types and observable semantics across supported operations;

// == CompileTimeContracts ==============================================
```

Specifications use ordinary `//` comments only and contain no JSDoc. Do not add
explanatory comments above conventional `IsExact` and `Assert` helpers; their
names and compile-time-contract section already communicate their purpose.

Use local `IsExact` and `Assert` aliases for exact public type contracts. Use
`@ts-expect-error` for intentionally rejected calls and keep such expressions in
an uninvoked named function so they remain compile-time-only without constant
conditions or runtime side effects.

Test stable error codes, strictness, defaults, coercion, transforms, failure
behavior, generic inference, safety boundaries, and every exported helper whose
contract is not already exhausted by another assertion. Prefer stable public
dependency output over private implementation inspection.

Do not add integration infrastructure, database mocks, or broad fixtures to a
unit specification. Persistence semantics belong to a separate real-database
integration contour when the module genuinely requires one.

## Repository hygiene

Keep registry tokens, environment files, and local credentials outside version
control. A local `.npmrc` may hold publishing authentication only while it remains
ignored; never copy its contents into source, documentation, logs, or fixtures.

Preserve unrelated working-tree changes and inspect `git status` before and after
repository-wide tools. Generated output and temporary migration snapshots remain
outside source compilation and package publication.

## Module change checklist

For each module change:

1. Read this guide, the implementation, specification, exports, and relevant consumers.
2. Search real consumers before changing types, behavior, or adding utilities.
3. Separate coherent responsibilities without mechanically multiplying files.
4. Introduce one module barrel and update the root export to reference it once.
5. Replace project-owned textual errors with a typed local error registry.
6. Derive public types from authoritative runtime or dependency sources.
7. Add narrow runtime guards where static callers can bypass type safety.
8. Rewrite comments and JSDoc only inside the module being changed.
9. Keep its spec colocated, public-facing, deterministic, and free of JSDoc.
10. Replace cross-module deep imports with imports from the owning local barrel.
11. Inspect generated declarations and the final diff for accidental expansion.

## Verification

Run focused checks while implementing, followed by complete package quality
assurance before declaring a module finished:

```bash
bun test src/<module>/<module>.spec.ts
bun run typecheck
bun run lint
bun run format:check
bun run test
bun run build
git diff --check
```

An exported symbol is incomplete until the module barrel, package root, runtime
tests, compile-time contracts, real consumers, and generated declarations agree
about its public shape and behavior.
