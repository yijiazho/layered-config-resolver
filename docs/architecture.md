# Architecture

## Overview

The Layered Config Resolver is a small synchronous TypeScript pipeline:

1. Discover and parse YAML layers.
2. Merge layers from lowest to highest precedence.
3. Resolve references against the final merged document.
4. Serialize the result as JSON or YAML.

Core transformations are pure and return new values. Filesystem access and process I/O are
kept at the loader and CLI boundaries.

## Module Structure

```text
src/
├── index.ts       Package entry point and identity
├── loader.ts      YAML file discovery, ordering, and parsing
├── merge.ts       Deep object merge and key-based array merge
├── references.ts  Reference parsing, scoped lookup, and tree resolution
├── resolver.ts    Merge and reference orchestration
├── output.ts      JSON and YAML serialization
└── cli.ts         Argument parsing, process I/O, and error presentation
```

Tests mirror these boundaries:

```text
test/
├── project.test.ts
├── loader.test.ts
├── merge.test.ts
├── references.test.ts
├── resolver.test.ts
├── nested.test.ts
├── output.test.ts
├── cli.test.ts
├── integration.test.ts
└── fixtures/
```

## Data Flow

```text
directory path or explicit file list
                 │
                 ▼
       loader.loadConfigFiles
       - discover .yaml/.yml
       - order directory files
       - parse with js-yaml
                 │
                 ▼
         LoadedConfig[]
                 │
                 ▼
    resolver.mergeConfigLayers
       - deep object merge
       - keyed array merge
                 │
                 ▼
       final merged document
                 │
                 ▼
 references.resolveAllReferences
       - lazy target resolution
       - scope navigation
       - cycle detection
                 │
                 ▼
       resolved plain object
                 │
          ┌──────┴──────┐
          ▼             ▼
    output.toJSON   output.toYAML
          │             │
          └──────┬──────┘
                 ▼
              stdout
```

`resolveConfig` owns the middle of this flow: it calls `mergeConfigLayers`, then
`resolveAllReferences`. The CLI owns loading and formatting.

## Core Contracts

### LoadedConfig

Defined in `src/loader.ts`:

```ts
interface LoadedConfig {
  path: string;
  config: unknown;
}
```

The path is retained for diagnostics. The loader accepts one directory, one file, or an
explicitly ordered list of files.

### Reference

Defined in `src/references.ts`:

```ts
interface Reference {
  syntax: string;
  scopePrefix: string;
  path: string;
  isAbsolute: boolean;
}
```

`scopePrefix` is empty for absolute references and contains one or more dots for relative
references. `path` excludes the scope prefix.

### ResolvedConfig

Defined in `src/resolver.ts`:

```ts
type ResolvedConfig = Record<string, unknown>;
```

Every input layer must be a plain object. `resolveConfig` returns a new, fully resolved plain
object.

### CLI contracts

`CliOptions` contains:

- `files`: directory or file arguments
- `output`: `json` or `yaml`
- `help`: whether help was requested

`CliIO` abstracts stdout and stderr so the CLI pipeline can be tested without global stream
mutation.

## Loader Design

Directory input is non-recursive. Only direct `.yaml` and `.yml` children are loaded.

Ordering rules:

1. Numeric filename prefixes sort numerically.
2. Equal prefixes sort alphabetically.
3. Unprefixed files sort last.

An explicit file array retains caller order. Missing paths, unsupported extensions, and YAML
parse failures include the source path in their errors.

## Merge Engine

`deepMerge(base, override)` dispatches by value type:

- Two arrays call `mergeArrays`.
- Two plain objects merge recursively.
- Other conflicts return a clone of the override.
- `null` or `undefined` override properties remove the base key.

`mergeArrays` chooses the first identifier present in both arrays:

```text
id → name → key → uid → uuid → _id
```

Matching items merge recursively. Base order is stable and unmatched override items append.
Without a shared key field, the override array replaces the base array.

Inputs are never mutated. Internal mutation is limited to newly constructed result values.

## Reference Engine

Reference handling has three layers:

1. `parseReferences` recognizes unescaped `${...}` expressions.
2. `resolveReference` calculates absolute or relative target paths and navigates the document.
3. `resolveAllReferences` walks the final tree and resolves every expression.

Whole-value references preserve the target type. Interpolated references convert target
values to strings.

### Lazy resolution

Targets are resolved on demand and cached by path. This allows references to point forward
or to values that are themselves references.

The active path stack detects cycles:

```text
a → b → c → a
```

Cycle errors report the complete loop. Missing-path errors report the target, missing
segment, and keys available at the failure point.

Escaped `$${...}` values are ignored by parsing and unescaped to literal `${...}` text in the
result.

## Output and CLI Boundaries

`toJSON` uses two-space `JSON.stringify` output and rejects values JSON cannot represent.

`toYAML` uses `js-yaml` with two-space indentation, no aliases, and unrestricted line width.

`runCli` performs the complete boundary workflow:

```text
parse args → load files → resolve config → serialize → write stdout
```

Expected operational and usage errors are converted to a one-line stderr message and exit
code `1`. Help and successful output use exit code `0`.

## Dependency Direction

```text
merge.ts ───────────────┐
references.ts ──────────┤
                        ▼
                   resolver.ts
                        │
loader.ts ──────────────┤
output.ts ──────────────┤
                        ▼
                      cli.ts
```

`merge`, `references`, `loader`, and `output` do not depend on one another. This keeps their
unit tests isolated and prevents circular imports.

## Extension Points

### Add an array identifier

Update `KEY_FIELDS` in `src/merge.ts` and add priority/fallback cases to
`test/merge.test.ts`.

### Add an input format

Extend extension validation and parsing in `src/loader.ts`. Keep parsing errors contextual,
and add loader plus CLI tests.

### Add an output format

Add a serializer in `src/output.ts`, extend `OutputFormat` and argument validation in
`src/cli.ts`, then add round-trip and CLI tests.

### Change reference syntax

Modify scanning and parsing in `src/references.ts`. Keep path calculation separate from tree
walking so parser, scope, and cycle behavior remain independently testable.

### Add asynchronous sources

Introduce an asynchronous loader boundary while keeping `mergeConfigLayers`,
`resolveAllReferences`, and the serializers synchronous and pure.

## Verification Strategy

- Unit tests define each module contract.
- Tier suites verify merge, references, and deep recursion.
- CLI tests exercise boundary errors and both output modes.
- `integration.test.ts` fixes the complete starter-pack result as an end-to-end contract.
- Strict TypeScript compilation verifies public and internal types.

See [design.md](design.md) for rationale and [execution-plan.md](execution-plan.md) for task
status.
