# Execution module conventions

These instructions apply recursively inside `src/execution`. They define the
first migrated Foundation module and intentionally override conflicting style
rules from the repository-level `AGENTS.md` within this directory only.

The conventions remain local while the migration is evaluated. Apply the same
model to other modules only when they are migrated deliberately. Once every
module follows it, move the stable rules into the repository guide and remove
this file.

## Module responsibilities

Keep execution concerns separated by responsibility:

- `execution.constants.ts` owns exported execution policy defaults;
- `execution.errors.ts` owns error factories and their derived code union;
- `execution.measurements.ts` owns timed execution results and behavior;
- `execution.retry.ts` owns retry orchestration and cancellable waiting;
- `execution.timeout.ts` owns timeout and caller-signal composition;
- `execution.types.ts` owns shared public execution contracts;
- `execution.utilities.ts` owns general outcome-handling utilities;
- `execution.validation.ts` owns ordered policy validation behavior;
- `execution.spec.ts` owns runtime and compile-time public contracts;
- `index.ts` aggregates the module APIs intended for the package root.

Do not merge distinct responsibilities merely to reduce the file count. Do not
split tiny implementation details into separate files when they cannot be used
independently from the operation that owns their state.

## Public boundaries

Export reusable execution primitives when they form a meaningful standalone
contract. A reusable timer such as `waitForRetry`, a policy default, an error
registry, or a domain type must not remain an undocumented private declaration.

Keep invocation-bound callbacks local. Abort listeners and promise rejectors
that close over the state of one `executeWithTimeout` call are implementation
details rather than reusable APIs and must not be exported artificially.

The local `index.ts` is the execution module barrel. It exports the APIs meant
to reach the package root through `src/index.ts`; validation internals remain
available across execution files without becoming package APIs automatically.

## Errors

Project-owned errors expose stable camelCase codes, never human-readable text.
Application layers own translated or displayable messages. Each error factory
belongs to the module registry in `execution.errors.ts`, including its concrete
error class and any standard platform error name.

Every error registry starts with this exact two-line header. Replace only
`{Entity}` and preserve its wording and punctuation:

```ts
// Specific errors describing failure scenarios for `{Entity}`-related operations;
// Used by the owning module to communicate stable and machine-readable failures;
```

Derive the public code union from registry keys instead of repeating literals.
Place this exact zone comment above it, replacing only `{entity}`:

```ts
// ↓ Inferred literal union of error codes from `{entity}Errors`;
```

Factory keys and emitted error messages use the same camelCase code. Never add
sentences, punctuation, prefixes, or implementation details to those messages.
Do not create a separate code-only object when the registry can remain the one
source of truth for both codes and error construction.

## Constants

Important exported constants require a meaningful two-line rectangular JSDoc.
The first line states the policy represented by the constant; the second line
explains its boundary, default behavior, or interpretation.

```ts
/**
 * Default total attempt count applied when no explicit retry limit is provided.
 * The value includes the initial operation and every subsequent retry attempt.
 */
export const DEFAULT_RETRY_MAX_ATTEMPTS = 3;
```

Simple constants that need only a short clarification use a trailing left-arrow
comment. Do not inflate them into JSDoc blocks or place the comment above them:

```ts
export const EXAMPLE_NON_IMPORTANT = 5; // ← Short contextual explanation.
```

## JSDoc

Give every non-obvious exported function, type, and important constant a
meaningful two-line JSDoc. Keep its lines visually balanced and describe real
behavior, guarantees, defaults, cancellation, or failure semantics.

Do not write one-line JSDoc. Do not document syntax already visible from a
signature. Keep `@example` only when a concrete composition materially improves
understanding, and never wrap an example in a fenced Markdown block.

Specifications are the exception: `execution.spec.ts` contains no JSDoc.
Test-local helpers use ordinary `//` comments even when they describe types or
functions that would require JSDoc in production code.

## Inline comments

Inline comments inside functions explain only non-obvious ordering, ownership,
cancellation, cleanup, or safety behavior. Every such comment ends with a period.

When a comment describes a multi-line block, prefix it with `↓` and leave one
blank line between the comment and the block it introduces:

```ts
// ↓ Release every timer and cross-signal listener after settlement.

clearTimeout(timeout);
signal.removeEventListener('abort', onAbort);
```

When a comment describes one specific line, omit the arrow and keep it directly
adjacent to that line without an intervening blank line:

```ts
// Preserve the original failure and its stack trace.
throw error;
```

Prefer one concise inline comment. Use a visually rectangular multi-line block
only when the reasoning cannot remain accurate and clear in a single line. Do
not add arrows independently to every line of a multi-line comment.

## Implementation

Use named function declarations for reusable behavior. Keep callbacks as local
closures only when they depend on state belonging to one invocation. Prefer
early returns where they make terminal states immediately visible.

Validate static policies before starting the supplied operation. Validate
dynamically resolved policies before allocating their resources. Preserve the
original operation failure when retry exhaustion or filtering stops execution.

Cancellation must preserve the caller's exact reason. Pre-aborted signals must
prevent operations from starting. Timers and listeners must be removed on every
settlement path so completed work cannot retain resources or be aborted later.

Avoid human-readable validation errors, unsafe casts, hidden promise rejections,
and unreachable fallback throws. Keep assertions adjacent to the compiler gap
they solve and explain the safety boundary when it is not self-evident.

## Specifications

The colocated `execution.spec.ts` verifies the public package surface through
`@/index`. It uses `test` from `bun:test`, deterministic runtime assertions, and
local `IsExact` and `Assert` helpers for exact compile-time contracts.

Use the concise execution-spec layout:

```ts
// These tests describe the public execution behavior covered by this specification;
// They preserve exact types and observable semantics across sync and async operations;

// == CompileTimeContracts ==============================================
```

Use ordinary `//` comments rather than JSDoc anywhere in the specification.
Keep section dividers balanced and reserve them for real behavioral groups.
Test exported defaults and helpers directly instead of relying only on indirect
coverage through larger orchestration functions.

Cover exact generic inference, success and failure preservation, invalid static
and dynamic policies, retry exhaustion, filtering, cancellation, timeout races,
pre-aborted signals, cleanup-sensitive behavior, and synchronous/asynchronous
measurement without testing private implementation details.

## Verification

Run focused verification during implementation and the complete package checks
before considering an execution-module change complete:

```bash
bun test src/execution/execution.spec.ts
bun run typecheck
bun run lint
bun run format:check
bun run test
bun run build
git diff --check
```

Inspect generated declarations after public API changes. An exported execution
symbol is incomplete until `src/execution/index.ts`, `src/index.ts`, runtime
tests, compile-time contracts, and declaration generation agree about it.
