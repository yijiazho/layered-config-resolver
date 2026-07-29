# Layered Config Resolver - Design & Rationales

## Overview
This document captures all design decisions and rationales for ambiguities not explicitly defined in the task.

---

## 1. Language Choice: TypeScript

**Rationale:**
- Modern, readable, widely used for infrastructure tooling
- Strong typing helps clarify merge/reference semantics
- Easy to handle both YAML parsing and JSON output
- Can run standalone or integrate into JS-based pipelines

---

## 2. Merge Strategy: Deep Recursive Merge

**Decision:**
- Objects merge recursively (e.g., `{a: {b: 1}} + {a: {c: 2}} = {a: {b: 1, c: 2}}`)
- Later layers override earlier layers at the leaf level
- Null values are treated as explicit "unset" (can unset a previous value)

**Rationale:**
- Standard practice in config systems (Helm, Kustomize, Terraform)
- Matches the infrastructure use case: layered overrides that compose

---

## 3. List/Array Merging: Key-Based Matching

**Decision:**
- Lists merge by identifying a unique key field (`id`, `name`, or `uuid`)
- If a list item in a later layer has matching key → merge with corresponding item
- If no matching key found → append to end
- If list has no identifiable key field → replace entirely (later layer wins)

**Example from input:**
```yaml
# Layer 1 (base)
services:
  - name: api
    port: 8080

# Layer 2 (env-prod)
services:
  - name: api
    cpu: "1"

# Result
services:
  - name: api
    port: 8080
    cpu: "1"
```

**Rationale:**
- Real config systems (Kustomize, Helm) use key-based merging for lists
- Avoids index position brittleness (adding items breaks later layers)
- Example input demonstrates this pattern: `services` list matches by `name`

**Key detection logic:**
- Scan list items for common key fields: `id`, `name`, `key`, `uid`, `uuid`, `_id`
- Use first found; no key = replace behavior

---

## 4. Reference Syntax: JSONPath-Like with Scope Prefixes

**Syntax:**
```
${<path>}
```

**Path Types:**

| Syntax | Scope | Example |
|--------|-------|---------|
| `${outputs.database.endpoint}` | Absolute (from root) | Points to root → outputs → database → endpoint |
| `${.host}` | Current object scope | Points to same level as where reference appears |
| `${..port}` | Parent scope (one level up) | Points to parent object's field |
| `${...db.host}` | Grandparent (two levels up) | Each extra `.` = one level up |

**Resolution Behavior:**
- All references resolve against the **final merged document** (after all layers combined)
- References can point across layers
- References can point to other references (if they've been resolved)

**Example:**
```yaml
config:
  base_timeout: 30
  read_timeout: "${.base_timeout}"  # Resolves to 30 (same level)
  listen_port: "${..port}"           # Resolves to parent's 'port' field
db:
  host: "${outputs.database.endpoint}"  # Absolute path
  read_host: "${.host}"              # Relative to db level
```

**Rationale:**
- JSONPath is intuitive and familiar to infrastructure operators
- Dot-prefix notation is common (lodash, Prometheus labels)
- Matches pattern shown in example
- Relative paths avoid hard-coding across layers

---

## 5. Reference Resolution Timing: Post-Merge

**Decision:**
- Resolve all references **after all layers have been merged**
- No circular references are allowed (will throw error)
- References to missing paths throw error (fail-fast)

**Rationale:**
- Ensures references can see full merged state
- Simpler mental model: "first merge everything, then resolve"
- Prevents intermediate states from being referenced
- Task says: "References resolve against the final merged result"

---

## 6. Precedence Ordering: Numeric Filename Prefix

**Decision:**
- Files are ordered by numeric prefix (00-*, 10-*, 20-*, etc.)
- Lower numbers = lower precedence (applied first)
- If no numeric prefix, file is positioned last
- Within same precedence level: alphabetical order

**Rationale:**
- Example input uses this convention (00-, 10-, 20-)
- Aligns with common DevOps practice (Kustomize, Ansible)
- Clear, unambiguous ordering

---

## 7. Type Conflicts: Later Layer Wins (Replacement)

**Decision:**
- If a layer defines a key with a different type than previous layers:
  - Later layer's type completely replaces earlier type
  - Example: `key: "string"` → `key: {nested: object}` results in object

**Rationale:**
- Avoids complex type coercion logic
- Operator intent is clear: if you redefine at a layer, you own it
- Matches override pattern users expect

---

## 8. Nested Structures (Tier 3): Recursive Application

**Decision:**
- Merging and injection apply recursively at all depths
- No distinction between "top-level" and "nested" config
- A reference inside a deeply nested object works the same as top-level
- Scope paths (`${..}`, `${.}`) are calculated relative to their containing object at any depth

**Rationale:**
- Cleaner implementation (no special cases)
- More flexible for complex config shapes
- Matches expected behavior

---

## 9. Error Handling

| Case | Behavior |
|------|----------|
| Reference to non-existent path | Throw error with path & available keys |
| Circular reference (A→B→A) | Detect on resolution, throw error |
| Malformed reference syntax | Throw parse error |
| Type mismatch in merge | Later layer wins (replacement) |
| Invalid YAML | Throw parse error |

---

## 10. Output Format

**Decision:**
- Output as JSON (normalized, language-agnostic)
- Also provide YAML option for readability
- Resolved result is a plain object (no special markers for references)

---

## 11. Input: YAML Files Only (for now)

**Decision:**
- Accept `.yaml` / `.yml` files as input
- Files can be passed as:
  - Directory path (auto-discovers and orders by filename)
  - Array of file paths (in explicit order)

---

## 12. Escaping

**Decision:**
- Literal `${...}` strings are escaped as `$${...}` (double `$`)
- On resolution, `$${...}` becomes `${...}` (literal string)

**Rationale:**
- Common escaping pattern in templating systems

---

## Summary of Design Principles

1. **Deep merge** for objects, **key-based merge** for lists
2. **Relative & absolute paths** for references, resolved post-merge
3. **Later layer wins** on type conflicts
4. **Recursive** application at all depths
5. **Fail-fast** on errors (missing paths, circular refs)
6. **Clear ordering** via numeric prefixes
7. **Sensible defaults** that match infrastructure tooling norms

