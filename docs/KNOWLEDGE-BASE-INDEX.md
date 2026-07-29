# Knowledge Base Index

Quick reference for all project documentation and principles.

---

## 🎯 Start Here

**First time?** Read in this order:
1. [README.md](../README.md) — Overview and examples
2. [docs/design.md](design.md) — Design decisions
3. [docs/SKILL-implementation.md](SKILL-implementation.md) — How to implement tasks

**Ready to work?**
- **Implementing:** [SKILL-implementation.md](SKILL-implementation.md)
- **Reviewing:** [SKILL-code-review.md](SKILL-code-review.md)
- **Questions:** [implementation-principles.md](implementation-principles.md)

---

## 📚 Document Map

### Core Documentation

| Document | Audience | Purpose |
|----------|----------|---------|
| [design.md](design.md) | Everyone | **WHY** — Design decisions & rationales for all 12 design sections |
| [tasks.md](tasks.md) | Implementers | **WHAT** — 20 detailed, agent-ready tasks with acceptance criteria |
| [execution-plan.md](execution-plan.md) | Project Managers | **WHEN** — Execution order, waves, tracker, milestones, timeline |
| [implementation-principles.md](implementation-principles.md) | Developers | **RULES** — 10 core principles + code standards + quality checklist |

### Workflow Guides

| Document | Audience | Purpose |
|----------|----------|---------|
| [SKILL-implementation.md](SKILL-implementation.md) | Implementers | **HOW TO IMPLEMENT** — 7-phase workflow for each task |
| [SKILL-code-review.md](SKILL-code-review.md) | Reviewers | **HOW TO REVIEW** — 10-point review checklist & approval criteria |

### Reference

| Document | Audience | Purpose |
|----------|----------|---------|
| [example.md](example.md) | Everyone | **EXAMPLES** — Sample input files demonstrating all features |

---

## 🧭 Finding What You Need

### "I need to understand the design"
→ Read [design.md](design.md)

### "I need to implement a task"
→ Read [tasks.md](tasks.md) to find your task  
→ Read [SKILL-implementation.md](SKILL-implementation.md) for workflow  
→ Reference [implementation-principles.md](implementation-principles.md) for standards  
→ Check [design.md](design.md) for technical details

### "I need to review code"
→ Read [SKILL-code-review.md](SKILL-code-review.md)  
→ Reference [implementation-principles.md](implementation-principles.md) for standards  
→ Check [tasks.md](tasks.md) for acceptance criteria

### "I need to plan the project"
→ Read [execution-plan.md](execution-plan.md)  
→ Check task dependencies in [tasks.md](tasks.md)  
→ Review milestones in [execution-plan.md](execution-plan.md)

### "I need to understand coding standards"
→ Read [implementation-principles.md](implementation-principles.md)

### "I need examples"
→ Read [example.md](example.md)  
→ Check test fixtures in `test/fixtures/`

---

## 🎓 The 10 Implementation Principles

All code follows these principles. See [implementation-principles.md](implementation-principles.md) for details.

1. **Design-Driven** — Code must align with [design.md](design.md)
2. **Test-First (TDD)** — Write tests before implementation
3. **Immutable** — Don't mutate inputs; return new objects
4. **Strongly Typed** — Use TypeScript; avoid `any`
5. **Clear Errors** — Descriptive messages with context
6. **Separated Concerns** — One module = one responsibility
7. **Readable Code** — Clarity over cleverness
8. **Meaningful Commits** — Atomic, descriptive git messages
9. **Pure Functions** — No global state or side effects
10. **Complete Criteria** — All acceptance criteria must be verified

---

## 📊 Project Overview

### Current Implementation Status

| Phase | Tasks | Status | Evidence |
|-------|-------|--------|----------|
| **Phase 0: Foundation** | TASK-0.1, TASK-0.2 | Complete | Strict build and 8 tests pass |
| **Phase 1: Tier 1** | TASK-1.1 to TASK-1.5 | Complete | 32 Tier 1 tests pass |
| **Phase 2: Tier 2** | TASK-2.1 to TASK-2.5 | Complete | 36 Tier 2 tests pass |
| **Phase 3: Tier 3** | TASK-3.1 | Complete | 5 deep-nesting tests pass |
| **Phase 4: CLI & Output** | TASK-4.1 to TASK-4.3 | Not started | Next implementation phase |
| **Phases 5-6** | TASK-5.1 to TASK-6.1 | Not started | Planned |

Phase 0 provides:

- Strict TypeScript compilation targeting ES2020 on Node.js
- Jest and `ts-jest` test infrastructure
- YAML runtime dependency through `js-yaml`
- CLI argument parsing through `minimist`
- Runnable `npm start` and `npm run cli` entry points
- Typed CLI parsing, help text, output-format validation, and graceful error scaffolding
- Required `src/`, `dist/`, `test/`, and `lib/` project structure

Phase 1 provides:

- Immutable deep merging for plain objects and type conflicts
- Explicit key removal through higher-precedence `null` or `undefined` values
- Key-based array merging using `id`, `name`, `key`, `uid`, `uuid`, then `_id`
- YAML file loading from directories and explicit file lists
- Numeric filename-prefix ordering with alphabetical tie-breaking
- Ordered layer resolution through `resolveConfig`
- Starter-pack fixtures and partial/full Tier 1 pipeline coverage

Phase 2 provides:

- Parsing for absolute and dot-prefixed relative `${...}` references
- Current-object, parent, ancestor, deep-object, and array-index path lookup
- Post-merge resolution against the final highest-precedence document
- Whole-value type preservation and multi-reference string interpolation
- Lazy chained-reference resolution with circular-reference detection
- Literal reference escaping through `$${...}`
- Contextual errors for malformed syntax and missing paths
- Cross-layer starter-pack verification through `resolveConfig`

Phase 3 verifies:

- Recursive object merging beyond five levels
- Absolute references from deeply nested objects
- Current, parent, grandparent, and higher ancestor scopes at depth
- Key-based arrays nested inside objects and other keyed array items
- Reference resolution after recursive nested-array merges

Verification commands:

```bash
npm run build -- --strict
npm test -- --runInBand
npm run test:tier1
npm run test:tier2
npm run test:tier3
npm start -- --help
npm audit --omit=dev
```

Implementation commits:

- `04f2fdc` - Initialize the TypeScript project scaffold (TASK-0.1)
- `23a9b7d` - Add the CLI skeleton and tests (TASK-0.2)
- `f51066c` - Implement deep recursive object merging (TASK-1.1)
- `ce7286e` - Add key-based array merging (TASK-1.2)
- `5c6f8c5` - Load and order YAML configuration files (TASK-1.3)
- `cc8ea72` - Stack ordered configuration layers (TASK-1.4)
- `9817fd3` - Add the complete Tier 1 fixture suite (TASK-1.5)
- `c4e0c61` - Parse absolute and relative reference syntax (TASK-2.1)
- `f247523` - Resolve scoped reference paths (TASK-2.2)
- `9de9903` - Resolve references across the final document (TASK-2.3)
- `8961fd0` - Integrate post-merge resolution (TASK-2.4)
- `bbbf3fe` - Verify the complete Tier 2 reference pipeline (TASK-2.5)
- `6e14553` - Verify recursive nested structures (TASK-3.1)

See [execution-plan.md](execution-plan.md) for the authoritative task tracker.

### Tiers (Features)

| Tier | Feature | Status | Doc |
|------|---------|--------|-----|
| **Tier 1** | Stack & override (merge layers) | Complete | [design.md §2-3](design.md#2-merge-strategy-deep-recursive-merge) |
| **Tier 2** | Cross-layer injection (references) | Complete | [design.md §4](design.md#4-reference-syntax-jsonpath-like-with-scope-prefixes) |
| **Tier 3** | Nested structures | Complete | [design.md §8](design.md#8-nested-structures-tier-3-recursive-application) |

### Tasks (20 Total)

| Phase | Count | Focus | Tasks |
|-------|-------|-------|-------|
| **Wave 0** | 2 | Foundation | TASK-0.1, 0.2 |
| **Wave 1** | 5 | Merge (Tier 1) | TASK-1.1 – 1.5 |
| **Wave 2** | 5 | References (Tier 2) | TASK-2.1 – 2.5 |
| **Wave 3** | 1 | Nested (Tier 3) | TASK-3.1 |
| **Wave 4** | 3 | CLI & Output | TASK-4.1 – 4.3 |
| **Wave 5** | 3 | Testing & Docs | TASK-5.1 – 5.3 |
| **Wave 6** | 1 | Git Commits | TASK-6.1 |

See [tasks.md](tasks.md) for details on each task.

### Timeline

- **Single developer:** ~35-40 hours (~5 working days)
- **Two developers:** ~20-25 hours (~3 working days, parallel)
- **Three developers:** ~15-18 hours (~2 working days, parallel)

See [execution-plan.md](execution-plan.md) for detailed timeline.

---

## 🛠️ Development Workflow

### For Implementers

**Follow this workflow for each task:**

```
1. Setup & Plan (15 min)
   └─ Understand requirements from tasks.md
   └─ Verify all dependencies complete
   
2. Write Tests First (30-60 min)
   └─ Convert acceptance criteria to tests
   └─ Create test fixtures
   
3. Implement (60-120 min)
   └─ Code to pass tests
   └─ Follow implementation-principles.md
   └─ Stay true to design.md
   
4. Run Tests (15-30 min)
   └─ All pass locally?
   
5. Code Quality (15-30 min)
   └─ TypeScript strict mode
   └─ Clear error messages
   └─ Good naming & structure
   
6. Commit (5-10 min)
   └─ Meaningful message
   └─ Reference task ID
   
7. Verify Criteria (10-15 min)
   └─ All acceptance criteria met?
   └─ Update tracker
```

**See:** [SKILL-implementation.md](SKILL-implementation.md) for full details

### For Reviewers

**Follow this checklist:**

```
✓ Acceptance Criteria (critical)
✓ Design Compliance
✓ Test Coverage
✓ Code Quality & Readability
✓ Principles Adherence
✓ Dependency Order
✓ Git Commit Quality
✓ Integration (no regressions)
✓ Documentation
✓ Performance
```

**See:** [SKILL-code-review.md](SKILL-code-review.md) for full details

---

## 🔍 Key Design Sections

| Section | Topic | Details |
|---------|-------|---------|
| **§1** | Language | TypeScript/Node.js |
| **§2** | Object Merge | Deep recursive |
| **§3** | Array Merge | Key-based matching (id, name, uuid) |
| **§4** | References | JSONPath-like syntax with dot-prefix scopes |
| **§5** | Resolution | Post-merge (all layers combined first) |
| **§6** | Ordering | Numeric prefix (00-, 10-, 20-) |
| **§7** | Type Conflicts | Later layer wins (replacement) |
| **§8** | Nesting | Recursive application at all depths |
| **§9** | Errors | Fail-fast with context |
| **§10** | Output | JSON & YAML formats |
| **§11** | Input | YAML files only |
| **§12** | Escaping | `$${...}` → literal `${...}` |

**See:** [design.md](design.md) for full rationale on each section

---

## 📋 Module Structure

Current Phase 3 implementation:

```
src/
├── index.ts       — Package entry point
├── cli.ts         — CLI parsing, help, and error scaffold
├── merge.ts       — Deep object and key-based array merging
├── loader.ts      — YAML loading and precedence ordering
├── references.ts  — Reference parsing and post-merge resolution
└── resolver.ts    — Layer merging and reference orchestration

test/
├── project.test.ts
├── cli.test.ts
├── merge.test.ts
├── loader.test.ts
├── resolver.test.ts
├── references.test.ts
├── nested.test.ts
└── fixtures/       — Tier 1 layers and loader cases
```

Planned final structure:

```
src/
├── merge.ts       → Deep merge & key-based array merge
├── references.ts  → Parse & resolve ${...} references
├── loader.ts      → Load YAML files & order by prefix
├── resolver.ts    → Orchestrate (merge + resolution)
├── output.ts      → Format JSON/YAML output
└── cli.ts         → CLI interface

test/
├── merge.test.ts
├── references.test.ts
├── loader.test.ts
├── integration.test.ts
└── fixtures/      → Test data (*.yaml, *.json)
```

**Dependency order** (can only import from left to right):
```
merge.ts ──┐
          ├─→ resolver.ts ──→ cli.ts
references.ts ┤
loader.ts ────┤
output.ts ────┘
```

---

## ✅ Success Criteria

**Project is complete when:**

- [ ] All 20 tasks complete with acceptance criteria verified
- [ ] Full test suite passes: `npm test`
- [ ] Builds cleanly: `npm run build -- --strict`
- [ ] CLI works: `npm start [files...]`
- [ ] Git history tells development story
- [ ] README has usage examples
- [ ] Integration test passes with example files
- [ ] All code follows the 10 principles
- [ ] All code matches design.md decisions
- [ ] No ambiguities remain

---

## 🚨 Red Flags

**Stop and ask for help if:**

- ❌ Design contradicts task description
- ❌ Acceptance criteria are ambiguous
- ❌ Task is blocked by incomplete dependency
- ❌ You need a package not in package.json
- ❌ You're tempted to mutate input objects
- ❌ You can't write a test for a criterion
- ❌ Two criteria contradict each other

See [implementation-principles.md §Red Flags](implementation-principles.md#red-flags--when-to-stop) for details.

---

## 🔗 Cross-References

### From Design Decisions to Tasks
- Design §2-3 (Merge) → TASK-1.1, TASK-1.2
- Design §4-5 (References) → TASK-2.1, TASK-2.2, TASK-2.3
- Design §6 (Ordering) → TASK-1.3
- Design §10 (Output) → TASK-4.1, TASK-4.2

### From Tasks to Implementation Guidance
- Any TASK → [SKILL-implementation.md](SKILL-implementation.md)
- Code review → [SKILL-code-review.md](SKILL-code-review.md)
- Standards → [implementation-principles.md](implementation-principles.md)

### From Principles to Code Standards
- Principle 1 → See design.md
- Principle 2 → Section "Test-First Development" in [implementation-principles.md](implementation-principles.md)
- Principle 4 → Section "Code Quality Standards" in [implementation-principles.md](implementation-principles.md)

---

## 📖 Quick Reference Checklists

### Before Starting a Task
- [ ] Read [design.md](design.md) relevant sections
- [ ] Read [tasks.md](tasks.md) for your task
- [ ] Check [execution-plan.md](execution-plan.md) for dependencies
- [ ] Read [implementation-principles.md](implementation-principles.md)
- [ ] Verify all blockers are complete

### Before Implementing
- [ ] All acceptance criteria understood?
- [ ] Can you write tests for each criterion?
- [ ] Do you understand the design for this feature?
- [ ] Are dependencies complete?

### Before Committing
- [ ] `npm run build` passes?
- [ ] `npm test` passes?
- [ ] No `console.log` or debug code?
- [ ] Error messages helpful?
- [ ] Code readable?
- [ ] Commit message clear and references task?

### Before Approving PR
- [ ] All 10 review criteria met?
- [ ] Acceptance criteria verified?
- [ ] Design compliance confirmed?
- [ ] Full test suite passes?
- [ ] No regressions introduced?

---

## 🎯 Key Files at a Glance

```
├── README.md                          ← Start here (overview & examples)
├── docs/
│   ├── design.md                      ← Design decisions (§1-12)
│   ├── tasks.md                       ← 20 tasks (TASK-0.1 to TASK-6.1)
│   ├── execution-plan.md              ← Timeline, waves, tracker, milestones
│   ├── implementation-principles.md   ← 10 principles + code standards
│   ├── SKILL-implementation.md        ← 7-phase implementation workflow
│   ├── SKILL-code-review.md           ← 10-point review checklist
│   ├── example.md                     ← Example input files
│   └── KNOWLEDGE-BASE-INDEX.md        ← This file
├── src/                               ← Implementation goes here
└── test/                              ← Tests go here
```

---

## 💡 Tips & Tricks

### Navigating Documentation
- Use Markdown search to find sections
- Click on cross-reference links
- Check tables of contents
- Look for section numbers (§1, §2, etc.) to find related info

### Understanding Dependencies
- Check "Blocked by" in [tasks.md](tasks.md)
- See dependency graph in [execution-plan.md](execution-plan.md)
- Verify critical path order

### Checking Progress
- Update status in [execution-plan.md](execution-plan.md) tracker
- Check milestones against current wave
- Review git log to see development story

### When Stuck
1. Read [implementation-principles.md](implementation-principles.md)
2. Check [design.md](design.md) for rationale
3. Look at test fixtures in [example.md](example.md)
4. Review acceptance criteria in [tasks.md](tasks.md)
5. If still stuck: document issue and ask (don't guess!)

---

## Last Updated

Updated: 2026-07-28 (Phase 3 / Tier 3 complete)

For latest updates, check git history:
```bash
git log --oneline docs/
```

