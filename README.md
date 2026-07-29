# Layered Config Resolver

A general-purpose configuration resolver that stacks multiple YAML layers, merges them with precedence ordering, and injects cross-layer references. Perfect for infrastructure automation pipelines (Pulumi → Helm, etc.) where configuration comes from multiple sources.

## Problem Statement

Infrastructure work often requires composing configuration from multiple sources:
- **Pulumi outputs** (infrastructure details: DB endpoints, VPC IDs)
- **Base config** (service defaults)
- **Environment overrides** (dev, staging, prod settings)
- **Service-specific config** (team overrides)

This resolver handles the complexity:
- **Stack N layers** with clear precedence
- **Merge overlapping configs** intelligently (deep merge, key-based array matching)
- **Inject values** across layers using a reference syntax
- **Handle nesting** recursively at all depths

## Features

### Tier 1: Stack & Override ✅
Merge ordered config layers into a single document where later layers take precedence.

```yaml
# Layer 0: 00-pulumi-outputs.yaml (lowest precedence)
outputs:
  database:
    endpoint: prod-db.internal
    port: 5432

# Layer 1: 10-base.yaml
services:
  - name: api
    port: 8080

# Layer 2: 20-env-prod.yaml (highest precedence)
services:
  - name: api
    cpu: "2"

# Result: services[0] has merged config (name, port, cpu)
```

**Merge Strategy:**
- **Objects:** Deep recursive merge (nested keys combine)
- **Arrays:** Key-based matching by `id`, `name`, `uuid` fields
- **Scalars:** Later layer wins

### Tier 2: Cross-Layer Injection ✅
Reference values from anywhere in the merged document using JSONPath-like syntax.

```yaml
db:
  host: "${outputs.database.endpoint}"  # Absolute path
  read_host: "${.host}"                 # Relative to current object
  
services:
  - name: api
    config:
      timeout: 30
      read_timeout: "${.timeout}"       # References same level
      listen_port: "${..port}"          # References parent level
```

**Resolution:**
- `${path.to.value}` — Absolute path from root
- `${.key}` — Current object level (same parent)
- `${..key}` — Parent level (one level up)
- `${...key}` — Grandparent level, etc.

All references resolve against the **final merged document**, enabling cross-layer dependencies.

### Tier 3: Nested Structures ✅
Merge and inject work recursively at all depths. No special handling needed—same rules apply whether at root or 10 levels deep.

## Quick Start

### Installation

```bash
git clone <repo>
cd layered-config-resolver
npm install
npm run build
```

### Basic Usage

```bash
# Resolve config from directory (auto-ordered by filename)
npm start ./config/layers/

# Resolve specific files in order
npm start config/00-base.yaml config/10-env.yaml config/20-prod.yaml

# Output as JSON (default) or YAML
npm start ./config/ --output json
npm start ./config/ --output yaml
```

### Example

Given these files:

**00-base.yaml:**
```yaml
tls:
  enabled: no
services:
  - name: api
    port: 8080
db:
  host: "${outputs.database.endpoint}"
```

**10-env-prod.yaml:**
```yaml
services:
  - name: api
    cpu: "2"
```

**Command:**
```bash
npm start . --output yaml
```

**Output:**
```yaml
tls:
  enabled: no
services:
  - name: api
    port: 8080
    cpu: "2"
db:
  host: prod-db.internal  # <-- resolved
```

## Project Structure

```
layered-config-resolver/
├── src/
│   ├── merge.ts          # Deep merge & key-based array merge
│   ├── references.ts     # Parse & resolve ${...} references
│   ├── loader.ts         # Load YAML files & order by prefix
│   ├── resolver.ts       # Orchestrate merge + resolution
│   ├── output.ts         # Format JSON/YAML output
│   └── cli.ts            # CLI interface
├── test/
│   ├── merge.test.ts
│   ├── references.test.ts
│   ├── loader.test.ts
│   ├── fixtures/         # Test data (*.yaml, *.json)
│   └── integration.test.ts
├── docs/
│   ├── design.md                    # Design decisions & rationales
│   ├── tasks.md                     # 17 implementation tasks
│   ├── execution-plan.md            # Execution order & tracker
│   ├── implementation-principles.md # 10 principles + standards
│   ├── SKILL-implementation.md      # How to implement tasks
│   ├── SKILL-code-review.md         # How to review code
│   └── example.md                   # Example input files
├── package.json
├── tsconfig.json
└── README.md (this file)
```

## Development Workflow

### For Implementers

Follow [docs/SKILL-implementation.md](docs/SKILL-implementation.md):

1. **Setup & Plan** (15 min) — Understand task requirements
2. **Write Tests First** (30-60 min) — TDD approach
3. **Implement** (60-120 min) — Code to pass tests
4. **Run Tests** (15-30 min) — Verify all pass
5. **Code Quality** (15-30 min) — Polish and review
6. **Commit** (5-10 min) — Meaningful git message
7. **Verify Criteria** (10-15 min) — Confirm completion

**Key Commands:**
```bash
npm install              # Install dependencies
npm run build            # TypeScript compilation
npm test                 # Run all tests
npm run test:watch      # Watch mode for development
npm start [files...]     # Run CLI
```

### For Reviewers

Follow [docs/SKILL-code-review.md](docs/SKILL-code-review.md):

**10-Point Review Checklist:**
1. ✓ Acceptance Criteria met
2. ✓ Design Compliance
3. ✓ Test Coverage
4. ✓ Code Quality
5. ✓ Principles Adherence
6. ✓ Dependency Order
7. ✓ Git Commit Quality
8. ✓ Integration
9. ✓ Documentation
10. ✓ Performance

## Implementation Principles

All code follows these 10 principles (see [docs/implementation-principles.md](docs/implementation-principles.md)):

1. **Design-Driven** — Strictly adhere to [docs/design.md](docs/design.md)
2. **Test-First** — Write tests before implementation
3. **Immutable** — Don't mutate inputs; return new objects
4. **Strongly Typed** — Use TypeScript; avoid `any`
5. **Clear Errors** — Descriptive messages with context
6. **Separated Concerns** — One module = one responsibility
7. **Readable Code** — Clarity over cleverness
8. **Meaningful Commits** — Atomic, clear messages
9. **Pure Functions** — No global state or side effects
10. **Complete Criteria** — All acceptance criteria must be met

## Design Decisions

Key design decisions are documented in [docs/design.md](docs/design.md):

- **Merge:** Deep recursive for objects, key-based matching for arrays
- **References:** JSONPath-like syntax with dot-prefix scope modifiers
- **Resolution:** Post-merge (all layers combined first, then references resolved)
- **Ordering:** Numeric prefix (00-, 10-, 20-) determines precedence
- **Error Handling:** Fail-fast with descriptive messages including context

## Tasks & Execution Plan

### 17 Implementation Tasks in 7 Waves

See [docs/tasks.md](docs/tasks.md) for detailed task breakdown and [docs/execution-plan.md](docs/execution-plan.md) for execution order.

**Wave Summary:**
- **Wave 1** — Project setup (2 tasks)
- **Wave 2** — Merge logic (5 tasks) ← Tier 1
- **Wave 3** — References (5 tasks) ← Tier 2
- **Wave 4** — Nested verify (1 task) ← Tier 3
- **Wave 5** — CLI & output (3 tasks)
- **Wave 6** — Testing & docs (3 tasks)
- **Wave 7** — Git commits (1 task, ongoing)

**Milestones:**
- M1: Tier 1 complete (Merge working)
- M2: Tier 2 complete (References working)
- M3: Tier 3 complete (Nesting verified)
- M4: CLI ready
- M5: Full test suite
- M6: Documentation complete
- M7: Ready for review

**Effort:**
- Single developer: ~35-40 hours (~5 working days)
- Two developers: ~20-25 hours (~3 days, parallel)
- Three developers: ~15-18 hours (~2 days, parallel)

## Git Workflow

Commits should be **atomic and meaningful**:

```
feat(scope): summary - description

- Detailed point 1
- Detailed point 2

Task: TASK-X.Y
```

Examples:
```
feat(merge): implement deep recursive merge
feat(references): add circular reference detection
test(loader): add file ordering tests
fix(output): handle null values in YAML
docs: update README with examples
```

**Before Committing:**
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] `npm test` passes (all tests pass)
- [ ] No `console.log` or debug code
- [ ] Code is readable and typed
- [ ] Error messages are descriptive

## Documentation Map

| Document | Purpose |
|----------|---------|
| [docs/design.md](docs/design.md) | **What**: Design decisions & rationales for all ambiguities |
| [docs/tasks.md](docs/tasks.md) | **How**: 17 detailed, agent-ready tasks with acceptance criteria |
| [docs/execution-plan.md](docs/execution-plan.md) | **When**: Execution order, waves, tracker, milestones |
| [docs/implementation-principles.md](docs/implementation-principles.md) | **Rules**: 10 principles + code standards + quality checklist |
| [docs/SKILL-implementation.md](docs/SKILL-implementation.md) | **Workflow**: 7-phase implementation process for each task |
| [docs/SKILL-code-review.md](docs/SKILL-code-review.md) | **Checklist**: 10-point review process for code approval |
| [docs/example.md](docs/example.md) | **Examples**: Sample input files demonstrating all features |

## Example: Full Resolution

### Input Files

**00-pulumi-outputs.yaml:**
```yaml
outputs:
  database:
    endpoint: prod-db.internal
    port: 5432
schema_version: 1.10
```

**10-base.yaml:**
```yaml
tls:
  enabled: no
  auto_renew: off
services:
  - name: api
    port: 8080
    config:
      base_timeout: 30
      read_timeout: "${.base_timeout}"
      listen_port: "${..port}"
  - name: web
    port: 8081
db:
  host: "${outputs.database.endpoint}"
  read_host: "${.host}"
routes:
  - path: /api
    upstream: api
  - upstream: web
```

**20-env-prod.yaml:**
```yaml
services:
  - id: api
    cpu: "1"
  - name: web
    cpu: "2"
db:
  port: "${outputs.database.port}"
```

### Execution

```bash
npm start . --output json
```

### Output

```json
{
  "outputs": {
    "database": {
      "endpoint": "prod-db.internal",
      "port": 5432
    }
  },
  "schema_version": 1.10,
  "tls": {
    "enabled": false,
    "auto_renew": false
  },
  "services": [
    {
      "name": "api",
      "port": 8080,
      "id": "api",
      "cpu": "1",
      "config": {
        "base_timeout": 30,
        "read_timeout": 30,
        "listen_port": 8080
      }
    },
    {
      "name": "web",
      "port": 8081,
      "cpu": "2"
    }
  ],
  "db": {
    "host": "prod-db.internal",
    "read_host": "prod-db.internal",
    "port": 5432
  },
  "routes": [
    {
      "path": "/api",
      "upstream": "api"
    },
    {
      "upstream": "web"
    }
  ]
}
```

**What happened:**
- ✅ **Layer 0** (Pulumi outputs): Provides `outputs` and `schema_version`
- ✅ **Layer 1** (Base): Adds services, db, tls, routes
- ✅ **Layer 2** (Prod env): Merges service `api` by name, adds `cpu` to both services, sets `db.port`
- ✅ **References resolved:** `read_timeout`, `listen_port`, `db.host`, `db.read_host`, `db.port`

## Contributing

### Getting Started

1. Read [docs/design.md](docs/design.md) to understand the design decisions
2. Pick a task from [docs/tasks.md](docs/tasks.md)
3. Follow [docs/SKILL-implementation.md](docs/SKILL-implementation.md) workflow
4. Submit code for review using [docs/SKILL-code-review.md](docs/SKILL-code-review.md)

### Requirements

- Node.js 16+
- npm
- TypeScript knowledge
- Git

### Code Quality Standards

See [docs/implementation-principles.md](docs/implementation-principles.md) for:
- Naming conventions
- Type requirements
- Test structure
- Comment standards
- Commit message format

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/merge.test.ts

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

**Test Structure:**
```
test/
├── merge.test.ts          # Test merge logic
├── references.test.ts     # Test reference parsing & resolution
├── loader.test.ts         # Test file loading & ordering
├── integration.test.ts    # End-to-end test with example files
└── fixtures/              # Test data
    ├── 00-base.yaml
    ├── 10-env.yaml
    └── expected-merged.json
```

## Troubleshooting

### Error: "Reference not found"
Check that the reference path exists in the merged config. Use `--output json` to see the actual structure.

### Error: "Circular reference detected"
Check for references that form a cycle: A→B→C→A. This is not allowed; break the cycle.

### Files not ordered correctly
Ensure filenames have numeric prefixes: `00-*.yaml`, `10-*.yaml`, `20-*.yaml`. Files are sorted by prefix, then alphabetically.

### Key not merging in arrays
Check that array items have an identifiable key field (`id`, `name`, `uuid`). If missing, the entire array is replaced.

## Performance

- **Configs under 10MB:** No optimization needed
- **Array merging:** Linear scan per merge (key-based, not indexed)
- **Reference resolution:** Single pass through final document
- **Nesting depth:** No practical limit (recursive)

## License

See LICENSE file

## Support

For questions or issues:
1. Check [docs/design.md](docs/design.md) for design decisions
2. Check [docs/example.md](docs/example.md) for examples
3. Open an issue with:
   - Input YAML files
   - Expected output
   - Actual output
   - Error message (if any)