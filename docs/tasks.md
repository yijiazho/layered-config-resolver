# Layered Config Resolver - Task Breakdown

All tasks reference the [design.md](design.md) document for technical decisions and rationales.

---

## Phase 0: Project Initialization

### TASK-0.1: Initialize TypeScript Project Structure
**Description:**
Set up a new TypeScript project with build tools, package managers, and project scaffolding.

**Context:**
- Language: TypeScript
- Runtime: Node.js
- Build: tsc + optional bundler
- Package manager: npm or yarn

**Acceptance Criteria:**
- [ ] `package.json` created with TypeScript, js-yaml, and test dependencies
- [ ] `tsconfig.json` configured for Node.js target (ES2020+)
- [ ] Directory structure: `src/`, `dist/`, `test/`, `lib/`
- [ ] Build scripts work: `npm run build` produces JavaScript in `dist/`
- [ ] ESLint/Prettier config optional but nice-to-have
- [ ] Git repository initialized (or reinitialize if needed)
- [ ] `.gitignore` includes `node_modules/`, `dist/`, `*.log`

**Dependencies:** None (start here)

**Complexity:** Low

---

### TASK-0.2: Create Project CLI Skeleton
**Description:**
Set up the CLI entry point and argument parsing structure. This doesn't implement logic yet, just scaffolding.

**Context:**
- CLI will accept: directory path or list of files, output format option (json/yaml)
- Need to handle errors gracefully
- Design reference: Section 5 & 11 in design.md

**Acceptance Criteria:**
- [ ] `src/cli.ts` or `bin/cli.ts` created
- [ ] Argument parser (yargs, commander, or minimist) integrated
- [ ] Help text describes usage: `resolver [files...] [--output json|yaml]`
- [ ] Error handling skeleton in place (not full logic, just error messaging structure)
- [ ] Entry point executable from `npm start` or `npm run cli`

**Dependencies:** TASK-0.1

**Complexity:** Low

---

## Phase 1: Tier 1 - Stack & Override (Merge Logic)

### TASK-1.1: Implement Core Deep Merge Function
**Description:**
Implement the recursive merge logic for plain objects. This is the foundation for all merging.

**Context:**
- Design reference: Section 2 (Deep Recursive Merge)
- Input: two objects (layer1, layer2), where layer2 takes precedence
- Must handle nested objects, primitives, null values
- Must NOT handle arrays yet (that's TASK-1.2)

**Acceptance Criteria:**
- [ ] Function `deepMerge(base: any, override: any): any` implemented in `src/merge.ts`
- [ ] Recursive merging of nested objects works
- [ ] Primitives: later layer value replaces earlier layer
- [ ] Null/undefined values from later layer unset keys from base
- [ ] Returns new object (doesn't mutate inputs)
- [ ] Unit tests pass:
  - Simple scalar override
  - Nested object merge
  - Null unsetting behavior
  - Deep nesting (3+ levels)

**Dependencies:** TASK-0.1

**Complexity:** Medium

---

### TASK-1.2: Implement Key-Based Array Merge
**Description:**
Extend merge logic to handle arrays using key-based matching.

**Context:**
- Design reference: Section 3 (List/Array Merging: Key-Based Matching)
- Key detection: `id`, `name`, `key`, `uid`, `uuid`, `_id` (in that order)
- If no key found: replace array entirely
- Items with matching keys: merge recursively
- Items without match: append to result

**Example:**
```yaml
# Base
services:
  - name: api
    port: 8080

# Override
services:
  - name: api
    cpu: "1"

# Result
services:
  - name: api
    port: 8080
    cpu: "1"
```

**Acceptance Criteria:**
- [ ] Function `mergeArrays(base: any[], override: any[]): any[]` in `src/merge.ts`
- [ ] Key field detection logic working
- [ ] Key-based merge: matching items merge recursively
- [ ] Non-matching items appended
- [ ] No key field: full replacement
- [ ] Preserves order: matched items stay in base position, new items append
- [ ] Unit tests pass:
  - Array with identifiable key field
  - Array without key field
  - Mixed: some items match, some don't
  - Nested structures within array items
  - Empty arrays

**Dependencies:** TASK-1.1

**Complexity:** Medium-High

---

### TASK-1.3: Implement Config File Loader & Ordering
**Description:**
Load YAML config files, parse them, and order by numeric filename prefix.

**Context:**
- Design reference: Section 6 (Precedence Ordering: Numeric Filename Prefix)
- Format: YAML (`.yaml` or `.yml`)
- Input: directory path or list of file paths
- Ordering: numeric prefix (00-, 10-, 20-), then alphabetical

**Acceptance Criteria:**
- [ ] Function `loadConfigFiles(input: string | string[]): {path: string, config: any}[]` in `src/loader.ts`
- [ ] YAML parsing works (js-yaml library)
- [ ] Directory scanning discovers `.yaml` and `.yml` files
- [ ] Files sorted by numeric prefix (00-, 10-, 20-, etc.)
- [ ] Files without numeric prefix go last
- [ ] Same prefix sorted alphabetically
- [ ] Error handling: missing files, parse errors
- [ ] Unit tests pass:
  - Single directory with multiple files
  - Explicit file list
  - Mixed numeric prefixes
  - No numeric prefix
  - Invalid YAML throws error

**Dependencies:** TASK-0.1

**Complexity:** Medium

---

### TASK-1.4: Integrate Loader & Merge into Resolver
**Description:**
Combine file loading and merge logic into a top-level resolver that stacks all layers.

**Context:**
- Design reference: Tier 1 requirement
- Takes ordered list of configs and merges them left-to-right
- Returns single merged result

**Acceptance Criteria:**
- [ ] Function `resolveConfig(configs: any[]): any` in `src/resolver.ts`
- [ ] Calls `deepMerge()` and `mergeArrays()` appropriately
- [ ] Processes layers in order (layer 0 first, layer N last)
- [ ] Returns merged result as plain object
- [ ] Unit tests pass:
  - Two layers
  - Three+ layers
  - Overlapping keys at multiple depths
  - Mixed scalar and object values

**Dependencies:** TASK-1.1, TASK-1.2, TASK-1.3

**Complexity:** Low

---

### TASK-1.5: Create Tier 1 Test Suite
**Description:**
Write comprehensive tests covering all merge scenarios using the example input files.

**Context:**
- Example files: `docs/example.md` (00-pulumi-outputs.yaml, 10-base.yaml, 20-env-prod.yaml)
- Create sample YAML files in `test/fixtures/`
- Tests should verify merge behavior at each layer

**Acceptance Criteria:**
- [ ] Test fixtures created: `test/fixtures/00-*.yaml`, `test/fixtures/10-*.yaml`, `test/fixtures/20-*.yaml`
- [ ] Test file: `test/merge.test.ts`
- [ ] Tests cover:
  - Layer 0→1 merge
  - Layer 0→1→2 full merge
  - Scalar overrides
  - Nested object merges
  - List merging by key
  - Type conflicts (replacement)
- [ ] All tests pass: `npm test` or `npm run test:tier1`
- [ ] Test output clear, error messages helpful

**Dependencies:** TASK-1.4

**Complexity:** Medium

---

## Phase 2: Tier 2 - Cross-Layer Injection (References)

### TASK-2.1: Implement Reference Parser
**Description:**
Parse reference syntax `${...}` from string values and extract path information.

**Context:**
- Design reference: Section 4 (Reference Syntax)
- Syntax: `${path}`, `${.path}`, `${..path}`, `${...path}`, etc.
- Regex or hand-coded parser needed
- Must handle escaping: `$${...}` should NOT be parsed as reference

**Acceptance Criteria:**
- [ ] Function `parseReferences(value: string): {text: string, references: Reference[]}` in `src/references.ts`
- [ ] Reference interface: `{syntax: string, scopePrefix: string, path: string, isAbsolute: boolean}`
- [ ] Detects all `${...}` patterns in a string
- [ ] Handles escaped `$${...}` (not parsed)
- [ ] Extracts scope prefix (`.`, `..`, `...`, etc.) and path
- [ ] Unit tests pass:
  - Absolute path: `${outputs.database.endpoint}`
  - Relative paths: `${.host}`, `${..port}`, `${...key}`
  - Multiple refs in one string: `"prefix-${.a}-middle-${.b}-suffix"`
  - No refs: plain string
  - Escaped refs: `$${...}` ignored

**Dependencies:** TASK-0.1

**Complexity:** Medium

---

### TASK-2.2: Implement Scope Resolution Engine
**Description:**
Given a reference and its context (where it appears in the document), resolve the path to the target value.

**Context:**
- Design reference: Section 4 (Reference Syntax) & Section 5 (Resolution Timing)
- Input: reference object, merged config, current context path
- Output: resolved value or error
- Must handle:
  - Absolute paths: from root
  - Relative paths: from current object (`.`)
  - Parent paths: up N levels (`..`, `...`, etc.)

**Example:**
```yaml
services:
  - name: api
    config:
      base_timeout: 30
      read_timeout: "${.base_timeout}"  # Should resolve to 30
      listen_port: "${..port}"           # Should resolve to services[0].port
```

**Acceptance Criteria:**
- [ ] Function `resolveReference(ref: Reference, config: any, contextPath: string[]): any` in `src/references.ts`
- [ ] Absolute path resolution: `${outputs.x.y}` → navigate from root
- [ ] Relative path resolution: `${.key}` → from context object
- [ ] Parent resolution: `${..key}`, `${...key}` → N levels up
- [ ] Deep path navigation: `a.b.c.d` works at any depth
- [ ] Error on missing path: clear error message
- [ ] Returns actual value or throws
- [ ] Unit tests pass:
  - Each reference type
  - Nested context
  - Missing path error
  - Chain navigation

**Dependencies:** TASK-2.1

**Complexity:** Medium-High

---

### TASK-2.3: Implement Reference Resolution Post-Merge
**Description:**
Walk the entire merged config tree and resolve all references.

**Context:**
- Design reference: Section 5 (Post-Merge)
- Input: merged config object
- Output: config with all `${...}` replaced by values
- Must detect and report circular references
- All references resolve against the FINAL merged state

**Acceptance Criteria:**
- [ ] Function `resolveAllReferences(config: any, parentPath?: string[]): any` in `src/references.ts`
- [ ] Recursively walks entire object tree
- [ ] Finds all reference strings (using parser from TASK-2.1)
- [ ] Resolves each using engine from TASK-2.2
- [ ] Replaces reference string with resolved value
- [ ] Circular reference detection: throws error with cycle path
- [ ] Returns new object (doesn't mutate input)
- [ ] Handles unescaping: `$${...}` → `${...}` (literal)
- [ ] Unit tests pass:
  - Single reference
  - Multiple references in one value
  - References to other references (two-hop)
  - Circular reference detected
  - Nested references at various depths

**Dependencies:** TASK-2.1, TASK-2.2

**Complexity:** High

---

### TASK-2.4: Integrate References into Main Resolver
**Description:**
Modify the main resolver to call reference resolution after merging.

**Context:**
- Modify `src/resolver.ts` from TASK-1.4
- Add post-merge reference resolution step

**Acceptance Criteria:**
- [ ] Main `resolveConfig()` now calls `resolveAllReferences()` after merging
- [ ] Returns fully resolved config
- [ ] Unit tests pass with references:
  - Single layer with references
  - Multiple layers with cross-layer references
  - References to values that exist in multiple layers

**Dependencies:** TASK-1.4, TASK-2.3

**Complexity:** Low

---

### TASK-2.5: Create Tier 2 Test Suite
**Description:**
Write comprehensive tests for reference parsing, resolution, and circular reference detection.

**Context:**
- Tests should use example input and verify reference resolution
- Example: `db.host: "${outputs.database.endpoint}"` should resolve to `prod-db.internal`

**Acceptance Criteria:**
- [ ] Test file: `test/references.test.ts`
- [ ] Test fixtures with references (can extend from TASK-1.5)
- [ ] Tests cover:
  - Absolute path resolution
  - Relative path resolution (`.`, `..`, `...`)
  - Cross-layer references
  - Missing path errors
  - Circular reference detection
  - Escaped references
  - Nested references
- [ ] All tests pass: `npm run test:tier2`
- [ ] Clear error messages in test output

**Dependencies:** TASK-2.4

**Complexity:** Medium

---

## Phase 3: Tier 3 - Nested Structures

### TASK-3.1: Verify Recursive Application
**Description:**
Ensure merge and reference resolution work recursively at ALL depths without special-casing.

**Context:**
- Design reference: Section 8 (Nested Structures: Recursive Application)
- Should already work if TASK-1 and TASK-2 are implemented correctly
- This task is verification and deep-nesting edge cases

**Acceptance Criteria:**
- [ ] Deep object nesting (5+ levels) merges correctly
- [ ] References inside deeply nested objects resolve
- [ ] Scope prefixes (`.`, `..`) work correctly at depth
- [ ] Arrays inside nested objects merge by key
- [ ] Test file: `test/nested.test.ts`
- [ ] Tests cover:
  - 5+ level nesting
  - References at depth
  - Scope resolution in nested context
  - Mixed arrays and objects
- [ ] All tests pass: `npm run test:tier3`

**Dependencies:** TASK-2.4

**Complexity:** Medium

---

## Phase 4: CLI & Output

### TASK-4.1: Implement JSON Output
**Description:**
Format resolved config as clean, readable JSON.

**Context:**
- Design reference: Section 10 (Output Format)
- Pretty-printed with indentation
- Should be valid JSON

**Acceptance Criteria:**
- [ ] Function `toJSON(config: any): string` in `src/output.ts`
- [ ] Pretty-prints with 2-space indentation
- [ ] All values are JSON-serializable
- [ ] Unit tests pass:
  - Scalar values
  - Objects
  - Arrays
  - Nested structures

**Dependencies:** TASK-0.1

**Complexity:** Low

---

### TASK-4.2: Implement YAML Output
**Description:**
Format resolved config as YAML for readability.

**Context:**
- Design reference: Section 10 (Output Format)
- Use js-yaml library (already added in TASK-0.1)

**Acceptance Criteria:**
- [ ] Function `toYAML(config: any): string` in `src/output.ts`
- [ ] Produces valid YAML
- [ ] Readable formatting
- [ ] Parses back correctly
- [ ] Unit tests pass

**Dependencies:** TASK-0.1

**Complexity:** Low

---

### TASK-4.3: Wire CLI to Core Logic
**Description:**
Connect CLI argument parsing to resolver and output functions.

**Context:**
- Update `src/cli.ts` from TASK-0.2
- Accept file/directory input
- Call resolver
- Format output (JSON or YAML)
- Handle errors gracefully

**Acceptance Criteria:**
- [ ] CLI accepts directory or file list
- [ ] `--output json|yaml` flag works
- [ ] Calls resolver and outputs result
- [ ] Error handling: missing files, parse errors, resolution errors
- [ ] Manual test: `npm start test/fixtures/` produces correct output
- [ ] Help text is clear: `npm start -- --help`

**Dependencies:** TASK-0.2, TASK-2.4, TASK-4.1, TASK-4.2

**Complexity:** Medium

---

## Phase 5: Testing & Documentation

### TASK-5.1: Create Integration Test
**Description:**
End-to-end test with the provided example files (00-pulumi-outputs.yaml, 10-base.yaml, 20-env-prod.yaml).

**Context:**
- Files described in `docs/example.md`
- Should test full pipeline: load → merge → resolve references
- Expected output should be documented

**Acceptance Criteria:**
- [ ] Test file: `test/integration.test.ts`
- [ ] Converts example files from `docs/example.md` into YAML test fixtures
- [ ] Runs full resolver pipeline
- [ ] Verifies:
  - All layers merged
  - Services array merged by name
  - References resolved (e.g., `db.host`, `read_timeout`)
  - Output structure is correct
- [ ] Documents expected output in comments
- [ ] All tests pass: `npm run test:integration`

**Dependencies:** TASK-2.4, TASK-3.1

**Complexity:** Medium

---

### TASK-5.2: Create README with Usage Examples
**Description:**
Write user-facing documentation explaining how to use the resolver.

**Context:**
- Explain layers, merging, and references
- Show CLI usage
- Provide example command-line invocations

**Acceptance Criteria:**
- [ ] File: `README.md` or updated existing `README.md`
- [ ] Sections:
  - Overview (what it does)
  - Installation / Setup
  - CLI Usage (with examples)
  - Configuration Format
  - Reference Syntax (with examples)
  - Merge Behavior (with examples)
  - Error Handling
  - Examples
- [ ] All examples are runnable (tested manually)
- [ ] Clear and concise

**Dependencies:** TASK-4.3

**Complexity:** Medium

---

### TASK-5.3: Create Architecture/Design Summary Document
**Description:**
Document the codebase architecture and how components fit together.

**Context:**
- Helps future developers understand design
- Explain module structure
- Explain key functions and their contracts

**Acceptance Criteria:**
- [ ] File: `docs/architecture.md`
- [ ] Sections:
  - Module structure (src/ layout)
  - Core components (merge, references, loader, resolver)
  - Data flow diagram (text or ASCII)
  - Key interfaces/types
  - Extension points (how to modify behavior)
- [ ] Clear and structured

**Dependencies:** TASK-4.3

**Complexity:** Low

---

## Phase 6: Git & Delivery

### TASK-6.1: Create Git Commits at Each Phase
**Description:**
Commit work at key milestones for review.

**Context:**
- Task says: "we will review your git commit history"
- Commits should be atomic and meaningful

**Suggested Commits:**
1. After TASK-1.4: `feat: implement layered merge (Tier 1)`
2. After TASK-2.4: `feat: implement reference injection (Tier 2)`
3. After TASK-3.1: `feat: verify nested structure support (Tier 3)`
4. After TASK-4.3: `feat: add CLI and output formatting`
5. After TASK-5.2: `docs: add README and usage examples`
6. Final: `chore: finalize and clean up`

**Acceptance Criteria:**
- [ ] Each commit has clear, descriptive message
- [ ] Commit only includes related changes
- [ ] `git log` tells the story of implementation
- [ ] No debug code or commented-out sections in final commits

**Dependencies:** Throughout

**Complexity:** Low (process task)

---

## Task Dependency Graph

```
TASK-0.1 (Project Init)
├── TASK-0.2 (CLI Skeleton)
├── TASK-1.1 (Deep Merge)
│   └── TASK-1.2 (Array Merge)
│       └── TASK-1.4 (Integrate)
│           └── TASK-1.5 (Tests)
├── TASK-1.3 (File Loader)
│   └── TASK-1.4 (Integrate)
├── TASK-2.1 (Reference Parser)
│   └── TASK-2.2 (Scope Engine)
│       └── TASK-2.3 (Resolve All)
│           └── TASK-2.4 (Integrate)
│               ├── TASK-2.5 (Tests)
│               └── TASK-3.1 (Nested Verify)
├── TASK-4.1 (JSON Output)
├── TASK-4.2 (YAML Output)
├── TASK-4.3 (Wire CLI)
│   └── TASK-5.1 (Integration Test)
├── TASK-5.2 (README)
├── TASK-5.3 (Architecture Doc)
└── TASK-6.1 (Commits)
```

---

## Summary

- **Total Tasks:** 17
- **Phases:** 6
- **Estimated Effort:** 
  - Individual tasks: 2-4 hours each
  - Total: ~40-50 hours for one person
  - Can be parallelized (Phase 4 can start when Phase 1 done, etc.)
- **Key Dependencies:** Core merge logic (TASK-1) must come first, then references (TASK-2)
