---
name: Implementation Skill - Layered Config Resolver
description: Implement tasks for the Layered Config Resolver project following design and principles
applyTo:
  - layered-config-resolver
  - workspace:contains(docs/design.md,docs/tasks.md)
---

# Skill: Implement Layered Config Resolver Tasks

Use this skill when implementing any TASK-X.Y for the Layered Config Resolver project.

## Prerequisites

Before starting any task, verify:

1. ✅ You have read [docs/design.md](docs/design.md) (all sections relevant to this task)
2. ✅ You have read [docs/implementation-principles.md](docs/implementation-principles.md)
3. ✅ You have reviewed [docs/execution-plan.md](docs/execution-plan.md) to confirm task dependencies
4. ✅ All BLOCKING tasks are complete and tested
5. ✅ You understand the acceptance criteria (from [docs/tasks.md](docs/tasks.md))

## Workflow

### Phase 1: Setup & Plan (15 min)

1. **Identify the task:** Find TASK-X.Y in [docs/tasks.md](docs/tasks.md)

2. **Check dependencies:** Verify all blocking tasks show as complete
   - If blocked: Stop and report blocker
   - If ready: Proceed

3. **Understand requirements:**
   - Read Description
   - Review Context (design section references)
   - Study all Acceptance Criteria
   - Note Complexity estimate

4. **Plan implementation:**
   - Which file(s) will be modified/created? (e.g., `src/merge.ts`, `test/merge.test.ts`)
   - What types/interfaces are needed?
   - What test cases are required (from acceptance criteria)?

### Phase 2: Write Tests First (TDD) (30-60 min)

Following test-first development principle:

1. **Create test file** if it doesn't exist
   - Name: `test/<module>.test.ts` where module matches the implementation module
   - Add test suite: `describe('FeatureName', () => { ... })`

2. **Convert each acceptance criterion to test cases**
   - One criterion = one or more test cases
   - Test name clearly describes what's being verified
   - Example criterion: "Recursive merging of nested objects works"
   - Example test: `test('merges nested objects recursively up to 5 levels', () => { ... })`

3. **Write test fixtures if needed**
   - Create test data in `test/fixtures/` (YAML, JSON files)
   - Example: `test/fixtures/layer-*.yaml` for merge tests

4. **Run tests** (they should fail at this point)
   ```bash
   npm test -- test/<module>.test.ts
   ```

### Phase 3: Implement (60-120 min)

Following design-driven, clean code principles:

1. **Create/update implementation file**
   - Determine which file: `src/<module>.ts` (usually one module per task)
   - Check design section for: types, function signatures, behavior

2. **Write function skeleton with JSDoc**
   ```typescript
   /**
    * Deep merge two objects recursively.
    * Later object takes precedence in conflicts.
    * @param base - Base object (not mutated)
    * @param override - Override object (not mutated)
    * @returns New merged object
    */
   export function deepMerge(base: any, override: any): any {
     // TODO: implement
   }
   ```

3. **Implement core logic**
   - Follow the design decisions precisely
   - Use strong typing (avoid `any` if possible)
   - Keep functions pure (no mutations of inputs)
   - Add comments for non-obvious logic
   - Handle edge cases from acceptance criteria

4. **Export functions appropriately**
   - Public functions: export with JSDoc
   - Private helpers: prefix with `_` (no export)

5. **Verify TypeScript compiles**
   ```bash
   npm run build
   ```

### Phase 4: Run Tests (15-30 min)

1. **Run target test file:**
   ```bash
   npm test -- test/<module>.test.ts
   ```

2. **Analyze failures:**
   - If test fails: Fix implementation (repeat Phase 3)
   - If implementation error: Fix code
   - Continue until all tests pass

3. **Run full test suite:**
   ```bash
   npm test
   ```
   Ensure you didn't break anything in other modules

### Phase 5: Code Quality & Polish (15-30 min)

1. **Check TypeScript strictness:**
   ```bash
   npm run build -- --strict
   ```
   Fix any warnings

2. **Add missing JSDoc** if any function lacks documentation

3. **Review code:**
   - Is it readable? (Can someone understand it in 2 min?)
   - Are error messages helpful? (Include context)
   - Did you follow naming conventions?
   - Is there unnecessary complexity?
   - Are inputs mutated? (They shouldn't be)

4. **Manual testing (if applicable):**
   - For CLI tasks: Test command-line invocations
   - For data transformation tasks: Test with example files from `docs/example.md`

### Phase 6: Commit (5-10 min)

1. **Review changes:**
   ```bash
   git status
   git diff
   ```

2. **Stage changes:**
   ```bash
   git add <files>
   ```

3. **Commit with meaningful message:**
   ```bash
   git commit -m "feat(scope): summary - description

   - Detailed point 1
   - Detailed point 2
   
   Task: TASK-X.Y"
   ```

4. **Verify commit:**
   ```bash
   git log -1 --oneline
   ```

### Phase 7: Verify Acceptance Criteria (10-15 min)

Go through [docs/tasks.md](docs/tasks.md) and check each criterion:

- [ ] Criterion 1 — Test/code evidence
- [ ] Criterion 2 — Test/code evidence
- [ ] ... (check all criteria)

Update the tracker in [docs/execution-plan.md](docs/execution-plan.md):
- Change status from 🟥 to 🟩
- Update % done to 100%
- Note completion date

## Principles to Follow (In Priority Order)

1. **Follow the Design** — If code contradicts [docs/design.md](docs/design.md), update design first or ask
2. **Test-First** — Write tests before implementation
3. **One Responsibility** — Each module does one thing well
4. **Strong Typing** — Use TypeScript types, avoid `any`
5. **Clear Errors** — Error messages include context and remediation
6. **Immutability** — Don't mutate inputs
7. **Readability** — Code clarity over cleverness
8. **Meaningful Commits** — Each commit tells part of the story

## Dependency Management

### Module Import Order (Respect This)

Only import from modules that should be complete before this task:

- `merge.ts` → can import from nothing else
- `references.ts` → can import from nothing else
- `loader.ts` → can import from nothing else
- `output.ts` → can import from nothing else
- `resolver.ts` → can import from merge, references, loader (MUST wait for all)
- `cli.ts` → can import from resolver, output

If you need to import from a future module, it means task order is wrong. **Stop and ask.**

### npm Packages

Only use packages in `package.json`. If you need a new package:

1. Check if it's already there
2. If not, discuss before adding
3. Update `package.json` and run `npm install`

Current approved packages:
- `js-yaml` — YAML parsing
- `jest` — Testing
- `typescript` — Language
- `@types/node` — Node.js types

## Red Flags 🚨

Stop and ask for help if:

- ❌ Design contradicts task description
- ❌ Acceptance criteria are ambiguous
- ❌ Task is blocked by incomplete dependency
- ❌ Error seems to require new package not in package.json
- ❌ You're tempted to mutate input objects
- ❌ You can't write a test for a criterion
- ❌ Two criteria contradict each other

## Success Checklist

Before marking task COMPLETE, verify:

- [ ] All acceptance criteria from [docs/tasks.md](docs/tasks.md) met
- [ ] All tests pass: `npm test`
- [ ] TypeScript compiles: `npm run build`
- [ ] No console.log or debug code left
- [ ] Code is readable and typed
- [ ] Meaningful git commit(s) made
- [ ] Tracker in [docs/execution-plan.md](docs/execution-plan.md) updated
- [ ] No new issues created in other modules (full test suite passes)

## Useful Commands

```bash
# Setup
npm install
npm run build

# Development
npm run build -- --watch
npm test -- --watch

# Verification
npm run build -- --strict
npm test
git log --oneline

# Cleanup
git status
git diff
```

## When You're Done

1. ✅ Verify acceptance criteria met (all)
2. ✅ Run full test suite (no failures)
3. ✅ Commit with meaningful message
4. ✅ Update tracker status to 🟩 100%
5. ✅ Notify team/next task owner

Next task in sequence is in [docs/execution-plan.md](docs/execution-plan.md). If ready, proceed; if not, wait for dependencies.

