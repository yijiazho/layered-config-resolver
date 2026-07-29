# Implementation Principles

These principles guide all implementation work on the Layered Config Resolver project.

---

## Core Principles

### 1. Design-Driven Implementation
- **Rule:** Every line of code must align with decisions in [docs/design.md](design.md)
- **Why:** Design was carefully thought out to handle ambiguities; deviations create inconsistencies
- **Check:** Before writing code, re-read the relevant design section
- **Example:** Don't change merge strategy from deep-recursive to shallow without design update

### 2. Test-First Development (TDD)
- **Rule:** Write tests BEFORE implementing the feature
- **Why:** Tests define acceptance criteria; they prevent regressions and clarify expected behavior
- **Check:** Each task has acceptance criteria → convert to test cases first
- **Example:** TASK-1.1 asks for deep merge of `{a: {b: 1}} + {a: {c: 2}} = {a: {b: 1, c: 2}}` → write test, then code
- **Tooling:** Jest for test runner, `npm test` to run all, `npm run test:watch` for development

### 3. Immutability & Pure Functions
- **Rule:** Don't mutate inputs; return new objects
- **Why:** Prevents side effects, makes debugging easier, supports composition
- **Check:** Functions should not modify arguments
- **Example:** `deepMerge(obj1, obj2)` returns NEW object, doesn't modify obj1 or obj2
- **Exception:** Internal mutation during construction is OK if final result is immutable

### 4. Strong Typing
- **Rule:** Use TypeScript types everywhere; avoid `any` unless absolutely necessary
- **Why:** Catches errors early, documents intent, makes code self-documenting
- **Check:** Run `tsc --noImplicitAny` to verify
- **Example:** 
  ```typescript
  interface Reference {
    syntax: string;
    scopePrefix: string;
    path: string;
    isAbsolute: boolean;
  }
  function resolveReference(ref: Reference, config: any, contextPath: string[]): any
  ```

### 5. Clear Error Handling
- **Rule:** Errors must be descriptive; include context (path, available keys, expected format)
- **Why:** Operators need to understand what went wrong and how to fix it
- **Check:** Error messages answer: "What failed?", "Where?", "Why?", "How do I fix it?"
- **Example (BAD):** `throw new Error("Reference not found")`
- **Example (GOOD):** `throw new Error("Reference '${outputs.database.endpoint}' not found. Available paths from root: outputs, schema_version")`

### 6. Separation of Concerns
- **Rule:** Each module has ONE responsibility
- **Why:** Makes code testable, reusable, and maintainable
- **Structure:**
  - `src/merge.ts` — Object/array merging logic ONLY
  - `src/references.ts` — Reference parsing and resolution ONLY
  - `src/loader.ts` — File loading and ordering ONLY
  - `src/output.ts` — JSON/YAML formatting ONLY
  - `src/cli.ts` — CLI argument handling ONLY
  - `src/resolver.ts` — Orchestration (calls other modules)
- **Check:** Does this file have a clear, single purpose?

### 7. Readable Code Over Clever Code
- **Rule:** Prioritize clarity; document non-obvious logic with comments
- **Why:** Future maintainers (including you) need to understand it quickly
- **Check:** Can someone unfamiliar with this code understand it in 2 minutes?
- **Example (BAD):** Inline regex with no explanation
- **Example (GOOD):** Named function with JSDoc comment explaining the regex

### 8. Meaningful Commits
- **Rule:** Each commit is atomic and has a clear message
- **Why:** Git history tells the story of development; helps with debugging (git blame/bisect)
- **Format:** `<type>: <scope> - <description>`
  - `feat: merge engine - implement deep recursive merge`
  - `test: references - add circular reference detection tests`
  - `fix: loader - sort files by numeric prefix correctly`
  - `docs: update README with CLI examples`
- **Check:** Can you explain this commit in one sentence?

### 9. No External State or Globals
- **Rule:** Functions take all inputs as parameters; no module-level state
- **Why:** Makes testing easier, prevents subtle bugs
- **Check:** No `let config = {}` at module level; pass it as parameter
- **Exception:** Logger or configuration object can be global/singleton if carefully managed

### 10. Accept Criteria Are the Law
- **Rule:** Task is complete when ALL acceptance criteria are satisfied AND tested
- **Why:** Prevents scope creep; provides clear completion definition
- **Check:** Before marking task done, verify every criterion
- **Example:** TASK-1.1 has 8 criteria; all 8 must be satisfied

---

## Code Quality Standards

### Naming Conventions
- **Variables:** camelCase (`mergedConfig`, `keyField`, `scopePrefix`)
- **Functions:** camelCase (`deepMerge`, `parseReferences`, `resolveAllReferences`)
- **Types/Interfaces:** PascalCase (`Reference`, `MergeConfig`, `ResolverOptions`)
- **Constants:** UPPER_SNAKE_CASE (`KEY_FIELDS = ['id', 'name', ...]`)
- **Private functions/methods:** Prefix with `_` (`_resolveAbsolutePath`)

### Comments & Documentation
- **Module level:** JSDoc comment explaining module purpose
- **Functions:** JSDoc with @param, @returns, @throws
- **Complex logic:** Inline comments explaining "why", not "what"
- **Example:**
  ```typescript
  /**
   * Deep merge two objects recursively.
   * Later object takes precedence in conflicts.
   * @param base - Base object (not mutated)
   * @param override - Override object (not mutated)
   * @returns New merged object
   * @throws Error if merge strategy cannot be determined
   */
  function deepMerge(base: any, override: any): any {
    // Key insight: we process override keys because later layer wins
    // ... rest of implementation
  }
  ```

### Code Structure
- **Max file size:** 300-400 lines (split larger files)
- **Max function size:** 50 lines (extract helpers)
- **Nesting depth:** Max 3 levels (refactor if deeper)
- **Line length:** 100 characters (soft limit, be reasonable)

### Testing Structure
```
src/
├── module.ts           (implementation)
test/
├── module.test.ts      (tests for module)
├── fixtures/           (test data files)
│   ├── 00-base.yaml
│   ├── 10-env.yaml
│   └── expected-merged.json
```

---

## Dependency Order Enforcement

### Critical Path Must Be Followed
```
✓ TASK-0.1 (setup) → TASK-1.1 (merge) → TASK-1.2 (arrays) → TASK-1.4 (integrate)
                                                                    ↓
✓ Don't implement TASK-2.1 (references) until TASK-1.4 is complete and tested
✓ Don't implement TASK-4.3 (CLI) until TASK-2.4 is complete
```

### Import Rules
- Only import from modules that are already complete (according to execution plan)
- Don't create circular dependencies
- Example: `references.ts` can import from `merge.ts`, but not vice versa

---

## Git Workflow

### Before Committing
1. ✓ Run `npm run build` (no TypeScript errors)
2. ✓ Run `npm test` (all tests pass)
3. ✓ Run `npm run lint` (if linting configured)
4. ✓ Verify no console.log or debug code
5. ✓ Rebase or merge cleanly (no conflicts)

### Commit Frequency
- After completing a logical chunk (usually 1-2 hours of work)
- After each accepted task is complete
- Not every tiny change

### Commit Message Format
```
<type>(<scope>): <subject> - <description>

<body>

<footer>
```

Example:
```
feat(merge): implement deep recursive merge

- Added deepMerge function to merge objects recursively
- Later layer takes precedence on conflicts
- Handles nested objects, nulls, and type changes
- Does not mutate inputs

Task: TASK-1.1
```

---

## Acceptance Criteria Checklist Template

For each task, create a checklist matching acceptance criteria:

```typescript
// Task: TASK-1.1 - Implement Core Deep Merge Function
describe('deepMerge', () => {
  // [ ] Function `deepMerge(base: any, override: any): any` implemented
  // [ ] Recursive merging of nested objects works
  // [ ] Primitives: later layer value replaces earlier layer
  // [ ] Null/undefined values from later layer unset keys from base
  // [ ] Returns new object (doesn't mutate inputs)
  
  test('merges nested objects recursively', () => {
    // verifies criterion
  });
  
  test('later layer overwrites primitives', () => {
    // verifies criterion
  });
  
  // ... one test per criterion
});
```

---

## Red Flags & When to Stop

Stop and ask for clarification if you encounter:

1. **Design contradiction:** "The design says X but task description says Y"
2. **Missing acceptance criteria:** "Task doesn't specify what 'working' means"
3. **Blocked dependency:** "TASK-2.1 depends on TASK-1.4 but I'm asked to do 2.1 first"
4. **Ambiguous requirement:** "It should 'handle' edge cases" (what edge cases?)"
5. **External blocker:** "I need tool/service/library that's not in package.json"

In these cases: **Document the issue and ask before proceeding.**

---

## Performance & Scale Considerations

- **Configs under 10MB:** No optimization needed, clarity first
- **Arrays:** Key-based lookup OK (linear scan per merge)
- **Nesting depth:** No practical limit (recursive)
- **Reference resolution:** Single pass through document

If performance issues arise: document in code, add TODO comment, discuss with team.

---

## Documentation Standards

### Code Documentation
- Every exported function has JSDoc
- Non-obvious logic has comments
- Examples in docstrings where helpful

### Tests Documentation
- Test names clearly state what's being tested
- Complex test setup has comments explaining why
- Test fixtures have README explaining structure

### Design Documentation
- Any deviation from [docs/design.md](design.md) is recorded in [docs/execution-plan.md](execution-plan.md)
- Decisions made during implementation logged with rationale

---

## Success Indicators

You're following the principles well if:

✅ Tests pass without modification to acceptance criteria  
✅ New developer can understand module purpose in < 2 minutes  
✅ Errors are helpful (provide context, not just "failed")  
✅ Code doesn't mutate inputs unexpectedly  
✅ Git history reads like a narrative of development  
✅ No TypeScript warnings (`tsc --strict`)  
✅ Task can be done without clarifying ambiguities  
✅ Code requires minimal comments (clear naming, structure)

