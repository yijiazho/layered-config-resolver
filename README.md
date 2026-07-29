# Layered Config Resolver

A TypeScript CLI and library for combining ordered YAML configuration layers, resolving
cross-layer references, and emitting JSON or YAML.

It is designed for infrastructure pipelines where one source produces values—such as Pulumi
outputs—and later layers consume or override them for environments and services.

## Features

- Deep, immutable merging of plain objects
- Key-based merging of arrays
- Numeric filename precedence for directory inputs
- Absolute and relative `${...}` references resolved after merging
- Recursive behavior across deeply nested objects and arrays
- Circular-reference and missing-path detection
- JSON and YAML output

## Requirements

- Node.js 20 or newer
- npm

## Installation

```bash
npm install
npm run build
```

## CLI Usage

```text
resolver [files...] [--output json|yaml]
```

Run through npm:

```bash
# Load every YAML file directly inside a directory.
npm start -- test/fixtures

# Preserve the explicit order of listed files.
npm start -- test/fixtures/00-pulumi-outputs.yaml test/fixtures/10-base.yaml test/fixtures/20-env-prod.yaml

# Select JSON (default) or YAML output.
npm start -- test/fixtures --output json
npm start -- test/fixtures --output yaml

# Show help.
npm start -- --help
```

The `npm run cli -- ...` command is equivalent to `npm start -- ...`.

## Configuration Format

Inputs must be `.yaml` or `.yml` files. The resolved root of every layer must be a plain
object.

For directory input, files are ordered by numeric filename prefix:

```text
00-pulumi-outputs.yaml
10-base.yaml
20-env-prod.yaml
settings.yaml
```

Lower numbers are applied first. Files with the same prefix are sorted alphabetically.
Unprefixed files are applied last. An explicit list keeps the order supplied on the command
line.

## Merge Behavior

Later layers have higher precedence.

### Objects

Plain objects merge recursively:

```yaml
# Base
service:
  host: localhost
  port: 8080

# Override
service:
  port: 9090

# Result
service:
  host: localhost
  port: 9090
```

### Scalars and type conflicts

A later scalar replaces an earlier scalar. If types differ, the later value replaces the
earlier value completely.

An override value of `null` removes the existing key.

### Arrays

Arrays use the first identifier field present in at least one item in both arrays, in this
priority:

```text
id, name, key, uid, uuid, _id
```

Items with the same selected key value merge recursively. Matched items retain their base
position; new items append. If no shared identifier field exists, the later array replaces
the earlier array.

Items that do not contain the selected field append unchanged. For example, when `name` is
selected, an override item containing only `id` does not match a base item containing only
`name`, even if their values are equal.

## Reference Syntax

References are resolved against the final merged document.

| Syntax | Meaning |
|---|---|
| `${outputs.database.endpoint}` | Absolute path from the root |
| `${.host}` | Field in the current containing object |
| `${..port}` | Field one object above the current object |
| `${...region}` | Field two objects above the current object |

Example:

```yaml
outputs:
  database:
    endpoint: prod-db.internal
    port: 5432

service:
  port: 8080
  config:
    timeout: 30
    read_timeout: "${.timeout}"
    listen_port: "${..port}"

db:
  host: "${outputs.database.endpoint}"
  url: "postgres://${.host}:${outputs.database.port}/app"
```

A string containing exactly one reference receives the referenced value without converting
its type. Embedded references are converted to text during interpolation.

References may point to other references. Cycles are rejected with the complete cycle path.

To emit a literal reference, escape it with an extra dollar sign:

```yaml
template: "$${outputs.database.endpoint}"
```

The resolved literal is `${outputs.database.endpoint}`.

## Output Formats

JSON is the default and uses two-space indentation:

```bash
npm start -- test/fixtures --output json
```

YAML is emitted in readable form and round-trips through `js-yaml`:

```bash
npm start -- test/fixtures --output yaml
```

## Starter Example

The repository includes these runnable layers:

- `test/fixtures/00-pulumi-outputs.yaml`
- `test/fixtures/10-base.yaml`
- `test/fixtures/20-env-prod.yaml`

Run the full example:

```bash
npm start -- test/fixtures --output json
```

The result includes:

- `db.host: "prod-db.internal"`
- `db.port: 5432`
- `services[0].config.read_timeout: 30`
- `services[0].config.listen_port: 8080`
- the `web` service merged by `name`
- the heterogeneous `id: api` override appended as a separate item

## Error Handling

The CLI exits with status `1` and prints a concise error without a stack trace for:

- Missing inputs
- Non-YAML inputs
- Invalid YAML
- Non-object layer roots
- Missing reference paths
- Circular references
- Invalid output formats

Missing reference errors include the unresolved path, missing segment, and available keys.

## Development and Testing

```bash
npm run build -- --strict
npm test -- --runInBand
npm run test:tier1
npm run test:tier2
npm run test:tier3
npm run test:integration
```

Tests and implementation follow the task workflow in
[docs/SKILL-implementation.md](docs/SKILL-implementation.md).

## Architecture and Design

- [Architecture](docs/architecture.md)
- [Design decisions](docs/design.md)
- [Task tracker](docs/execution-plan.md)
- [Knowledge-base index](docs/KNOWLEDGE-BASE-INDEX.md)

## License

See [LICENSE](LICENSE).
