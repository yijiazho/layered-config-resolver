---
name: Code Review Skill - Layered Config Resolver
description: Review implementation PRs/commits for the Layered Config Resolver project
applyTo:
  - layered-config-resolver
  - workspace:contains(docs/design.md,docs/tasks.md,docs/implementation-principles.md)
---

# Skill: Code Review for Layered Config Resolver

Use this skill when reviewing code for TASK-X.Y implementations.

## Pre-Review Setup

1. **Identify the task:** Which TASK-X.Y is being reviewed?
2. **Get context:** Read the task in [docs/tasks.md](docs/tasks.md)
3. **Understand design:** Read relevant section in [docs/design.md](docs/design.md)
4. **Know principles:** Review [docs/implementation-principles.md](docs/implementation-principles.md)

---

## Review Checklist

### 1. Acceptance Criteria (Critical) ✅

**Purpose:** Verify the task is actually complete

For each acceptance criterion in [docs/tasks.md](docs/tasks.md):

- [ ] Criterion 1 → evidence in tests/code
- [ ] Criterion 2 → evidence in tests/code
- [ ] Criterion N → evidence in tests/code

**How to verify:**
1. Find the acceptance criteria for TASK-X.Y
2. For each criterion, locate corresponding test or code
3. Ask: "If I remove this, would the test fail?" (if not, criterion not really verified)

**If missing:** Request implementation of missing criterion

---

### 2. Design Compliance 📋

**Purpose:** Ensure code matches the carefully thought-out design

**Check each relevant design section:**

For TASK-1.1 (Deep Merge):
- [ ] Design Section 2: Are objects merged recursively? ✓
- [ ] Design Section 2: Do later values override earlier? ✓
- [ ] Design Section 2: Are null values treated as "unset"? ✓

For TASK-1.2 (Array Merge):
- [ ] Design Section 3: Does it detect key fields in order [id, name, ...]? ✓
- [ ] Design Section 3: Does it match by key and merge? ✓
- [ ] Design Section 3: Does it append non-matching items? ✓
- [ ] Design Section 3: Does it replace if no key found? ✓

For TASK-2.1 (Reference Parser):
- [ ] Design Section 4: Does syntax parser correctly identify `${...}` patterns? ✓
- [ ] Design Section 4: Does it handle `.`, `..`, `...` prefixes? ✓

**If not matching:** Comment with design reference and request change

---

### 3. Test Coverage 🧪

**Purpose:** Ensure code is tested and testable

**Structure checks:**
- [ ] Tests exist in `test/<module>.test.ts`
- [ ] Test file imports the implementation
- [ ] Tests can run independently: `npm test -- test/<module>.test.ts`

**Coverage checks:**
- [ ] All acceptance criteria have at least one test
- [ ] Edge cases are tested (null, empty, deep nesting, etc.)
- [ ] Error cases are tested (missing paths, invalid input, etc.)
- [ ] Normal cases are tested (happy path)

**Quality checks:**
- [ ] Test names clearly describe what's tested
- [ ] Tests don't test implementation details, only behavior
- [ ] No skipped tests (`.skip` or `.only`)
- [ ] Test fixtures are in `test/fixtures/`

**How to verify:**
1. Count acceptance criteria → should have ≥ that many tests
2. Run tests: `npm test -- test/<module>.test.ts` → all pass?
3. Read test names → can you understand what each tests without reading code?

**If insufficient:** Request additional tests

---

### 4. Code Quality & Readability 📝

**Purpose:** Ensure code is maintainable

#### TypeScript Strictness
- [ ] No `any` types (or rare with explanation)
- [ ] All function parameters typed
- [ ] All function return types specified
- [ ] No `ts-ignore` comments
- [ ] Builds with `npm run build -- --strict`

**How to verify:**
```bash
npm run build -- --strict
# Should have zero errors
```

#### Naming Conventions
- [ ] Variables: camelCase (`mergedConfig`, `keyField`)
- [ ] Functions: camelCase (`deepMerge`, `parseReferences`)
- [ ] Types/Interfaces: PascalCase (`Reference`, `MergeConfig`)
- [ ] Constants: UPPER_SNAKE_CASE (`KEY_FIELDS`)
- [ ] Private functions: `_privateFunctionName`

**How to verify:** Visual scan of code

#### Code Structure
- [ ] Functions are focused (< 50 lines ideal)
- [ ] No deep nesting (max 3 levels)
- [ ] No unreachable code
- [ ] No commented-out code (delete it or add TODO)

**How to verify:** Visual scan; ask author about complex sections

#### Comments & Documentation
- [ ] Functions have JSDoc with @param, @returns, @throws
- [ ] Complex logic has inline comments explaining "why"
- [ ] No obvious comments (e.g., `// increment i` is not helpful)
- [ ] Module has header comment explaining purpose

**Example review comment:**
```
Missing JSDoc on deepMerge function. Please add:
/**
 * Deep merge two objects recursively.
 * @param base - Base object (not mutated)
 * @param override - Override object (not mutated)
 * @returns New merged object
 */
```

#### Error Handling
- [ ] Error messages are descriptive
- [ ] Errors include context (path, available keys, etc.)
- [ ] No generic "failed" errors
- [ ] Error cases are tested

**Example review comment:**
```
Error message "Reference not found" is too generic.
Should include: which reference, which path was attempted, what keys are available.

Current: throw new Error("Reference not found")
Expected: throw new Error(`Reference '${refName}' at path '${path}' not found. Available paths: ${available.join(', ')}`)
```

---

### 5. Principles Adherence 🎯

**Purpose:** Ensure code follows established principles

#### Design-Driven
- [ ] Deviations from design are justified in comments/commit messages
- [ ] No arbitrary changes to design decisions

#### Test-First Development
- [ ] Tests were written before implementation (check git history)
- [ ] Tests define the behavior

#### Immutability
- [ ] Input objects are not mutated
- [ ] New objects are returned, not modified originals

**How to verify:**
```typescript
// GOOD: Returns new object
const merged = deepMerge(obj1, obj2);
// obj1 and obj2 are unchanged

// BAD: Mutates input
obj1.field = obj2.field;
return obj1;
```

#### Pure Functions
- [ ] No side effects (no external state changes)
- [ ] No hidden dependencies (all inputs as parameters)
- [ ] Same input → same output (deterministic)

#### Separation of Concerns
- [ ] Module does one thing (check imports)
- [ ] Doesn't mix concerns (e.g., merge.ts shouldn't do YAML parsing)
- [ ] Can be tested in isolation

---

### 6. Dependency Order 🔗

**Purpose:** Ensure critical path isn't violated

**Check task dependencies:**
1. What does this task depend on? (From [docs/tasks.md](docs/tasks.md))
2. Are all dependencies imported correctly?
3. Does code only import from COMPLETE tasks?

**Red flags:**
- ❌ Importing from a task that isn't done yet
- ❌ Circular imports (A imports B, B imports A)
- ❌ Importing from non-existent modules

**How to verify:**
1. Check imports in the file
2. Confirm those modules exist and are complete
3. Check imports in those modules
4. No cycles? ✓

**Example review comment:**
```
This task (TASK-2.4) imports from resolver.ts, but TASK-1.4 
(which creates resolver.ts) isn't marked complete yet. 
According to execution-plan.md, TASK-2.4 should start after TASK-1.4.
```

---

### 7. Git Commit Quality 📝

**Purpose:** Ensure clear development history

**Check commits in PR/review:**
- [ ] Commit message follows format: `<type>(<scope>): <summary>`
- [ ] Commit message includes task ID (TASK-X.Y)
- [ ] Commits are atomic (each commit is one logical change)
- [ ] No "work in progress" or fixup commits mixed in
- [ ] No merge commits (should be rebased)

**Example good commit:**
```
feat(merge): implement deep recursive merge

- Added deepMerge function for recursive object merging
- Later layer values override earlier layer
- Handles nested objects, nulls, and type changes
- Returns new object (no mutation of inputs)

Task: TASK-1.1
```

**Example bad commit:**
```
wip: stuff
Fixed
trying again
final final FINAL
```

**If poor:** Request commit reorganization before merge

---

### 8. Integration & Side Effects 🔄

**Purpose:** Ensure new code doesn't break existing code

**Checks:**
- [ ] Full test suite passes: `npm test` (not just new tests)
- [ ] No new console.log or debug code
- [ ] No new TODOs without context
- [ ] No hardcoded paths/values that should be configurable

**How to verify:**
1. Check out branch
2. Run `npm install && npm run build && npm test`
3. All pass? ✓

---

### 9. Documentation 📚

**Purpose:** Ensure reviewers and future devs can understand

**Checks:**
- [ ] Code comments explain non-obvious logic
- [ ] Functions have JSDoc
- [ ] Complex test setup has explanation
- [ ] No documentation contradicts implementation

**For PRs:**
- [ ] Commit message links to task
- [ ] Complex logic has inline comments
- [ ] If design wasn't followed, documented why

---

### 10. Performance & Scalability ⚡

**Purpose:** Catch obvious performance issues

**Checks:**
- [ ] No O(n²) algorithms for n > 1000
- [ ] No deep nesting > 10 levels without careful handling
- [ ] No infinite loops (all recursion has base case)
- [ ] No memory leaks from circular references (in Node.js)

**For this project:**
- ✓ Configs < 10MB OK without optimization
- ✓ Linear scan of arrays OK
- ✓ No practical depth limits

---

## Review Workflow

### Step 1: Initial Assessment (5 min)
```
1. Is this addressing TASK-X.Y? ✓
2. Are dependencies complete? ✓
3. Do tests exist? ✓
4. Does code compile? ✓
```

### Step 2: Acceptance Criteria (10 min)
```
For each criterion:
- Find test or code evidence
- Verify it matches criterion exactly
- Ask author if unclear
```

### Step 3: Design Compliance (10 min)
```
Read relevant design section
Check code matches decisions
Comment on deviations
```

### Step 4: Code Quality (15 min)
```
Read code line-by-line
Check naming, types, comments
Spot complexity or readability issues
Check error handling
```

### Step 5: Tests (10 min)
```
Scan test file
Run tests: npm test -- test/module.test.ts
Check coverage against criteria
```

### Step 6: Integration (5 min)
```
Run full test suite: npm test
Check for regressions
Verify commit quality
```

### Step 7: Summary (5 min)
```
All OK? → Approve ✅
Issues found? → Request changes with clear comments
Blockers? → Block with clear feedback
```

---

## Review Comment Template

### For Missing Criteria
```
Missing criterion from TASK-X.Y acceptance criteria:
> [Criterion text]

I don't see this implemented or tested. Evidence:
- [What you looked for]
- [Where you looked]

Please implement this criterion.
```

### For Design Deviation
```
This doesn't match [docs/design.md](design.md), Section X:
> [Design text]

Current implementation: [What code does]
Expected per design: [What design says]

Is there a reason for the deviation? If so, please document it.
```

### For Code Quality
```
This function has readability issue:

Problem: [What's unclear]
Why: [Why it matters]
Suggestion:
[Show improved version]

Let me know if you'd like to discuss alternatives.
```

### For Missing Tests
```
This criterion needs a test:
> [Criterion]

Current test coverage: [What's tested]
Gap: [What's not tested]

Please add test case(s) for this.
```

---

## Approval Criteria

### ✅ Approve If:
- [ ] All acceptance criteria verified (with tests)
- [ ] Passes full test suite
- [ ] Follows design decisions
- [ ] Code is readable and typed
- [ ] No design contradictions
- [ ] Meaningful commit(s)
- [ ] No regressions in other modules

### 🟨 Request Changes If:
- [ ] Acceptance criteria not met
- [ ] Tests missing or failing
- [ ] Code quality issues
- [ ] Design deviation without explanation
- [ ] Poor commit messages

### 🛑 Block If:
- [ ] Violates critical path (imports from incomplete task)
- [ ] Breaks existing tests
- [ ] Contradicts design without discussion
- [ ] Security/safety concern

---

## Common Issues & How to Fix

### Issue: "Function is too long"
**Fix:** Extract helper functions, split into smaller focused functions

### Issue: "No tests for error cases"
**Fix:** Add tests for when input is invalid, paths don't exist, etc.

### Issue: "Function mutates input"
**Fix:** Create new object, don't modify parameter. Return the new object.

### Issue: "Error message isn't helpful"
**Fix:** Include context: what failed, where, what were you expecting, what's available

### Issue: "Code imports from incomplete task"
**Fix:** Either the task order is wrong, or this task is being done too early

### Issue: "Doesn't match design"
**Fix:** Either update design (with discussion), or update code to match design

---

## Questions to Ask Author

If something seems off, ask:

1. **"Why did you...?"** — Understand the decision
2. **"How does this handle...?"** — Edge cases
3. **"Where's the test for...?"** — Acceptance criteria coverage
4. **"Does this match Section X in design.md?"** — Design compliance
5. **"Why not...?"** — Alternative approaches

---

## After Approval

1. Confirm all concerns addressed
2. Mark as approved
3. Merge/commit
4. Update tracker in [docs/execution-plan.md](docs/execution-plan.md)
5. Notify next task owner of dependency completion

