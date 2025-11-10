# Parallel Agent Orchestration: Learning Guide

**Type:** Guide | Learning Resource
**Status:** Active
**Created:** 2025-11-10
**Last Updated:** 2025-11-10
**Verified For:** v0.1.0
**Dependencies:** [CLAUDE.md](../../CLAUDE.md), [Agent Prompt Templates](.claude/AGENT_PROMPT_TEMPLATES.md)
**Estimated Read Time:** 5-60 minutes (progressive levels)

## Purpose
Transform complex parallel agent orchestration from an advanced technique into an accessible skill through progressive learning levels, actionable playbooks, and proven templates.

## Quick Links
- [🚀 5-Minute Quick Start](#-5-minute-quick-start)
- [📚 Learning Levels](#-learning-levels)
- [🎯 Scenario Playbooks](#-scenario-playbooks)
- [📖 Agent Prompt Templates](#-agent-prompt-templates)
- [📊 Case Studies Archive](../10-ANALYSIS/ANALYSIS_PARALLEL_AGENT_ORCHESTRATION.md)

## Table of Contents
- [🚀 5-Minute Quick Start](#-5-minute-quick-start)
- [📚 Learning Levels](#-learning-levels)
  - [101: Fundamentals (15 minutes)](#101-fundamentals-15-minute-read)
  - [201: Intermediate (30 minutes)](#201-intermediate-30-minute-read)
  - [301: Advanced (45 minutes)](#301-advanced-45-minute-read)
- [🎯 Scenario Playbooks](#-scenario-playbooks)
- [📖 Agent Prompt Templates](#-agent-prompt-templates)
- [🔧 Troubleshooting Guide](#-troubleshooting-guide)
- [📊 Quick Reference Tables](#-quick-reference-tables)

---

## 🚀 5-Minute Quick Start

### When to Use Parallel Agents: Decision Flowchart

```
Task identified
  ↓
Is it >15 minutes? ──NO──→ Do it yourself
  ↓ YES
Are subtasks independent? ──NO──→ Do sequentially
  ↓ YES
Are there 2+ categories? ──NO──→ Single agent or sequential
  ↓ YES
Time savings >30%? ──NO──→ Consider sequential
  ↓ YES
→ DEPLOY PARALLEL AGENTS
  ↓
Read Scenario Playbook for your task type
  ↓
Select template from Quick Reference
  ↓
Deploy agents with Task tool
  ↓
Consolidate results
```

### Most Common Scenarios with Solutions

| Scenario | Solution | Time Savings |
|----------|----------|--------------|
| **"Update 20+ dependencies"** | 4 agents by category | 88-92% |
| **"Refactor 30+ files"** | 3 agents by module | 60-75% |
| **"Fix all ESLint errors"** | 3 agents by error type | 70-80% |
| **"Create comprehensive tests"** | 2-3 agents by domain | 40-50% |
| **"Apply pattern across codebase"** | 3 agents by directory | 40-50% |

### Template Selection Guide

```
Is it a known pattern? ──YES──→ Use Haiku model + Pattern Template
  ↓ NO
Does it need architecture decisions? ──YES──→ Use Opus + Refactoring Template
  ↓ NO
Is it database/migration work? ──YES──→ Use Opus + Database Template
  ↓ NO
Is it test creation? ──YES──→ Use Opus + Test Creation Template
  ↓ NO
→ Use Opus + Generic Mission Template
```

### Success Checklist

**Before Deploying:**
- [ ] Tasks are truly independent (no file conflicts)
- [ ] Each agent has clear success criteria
- [ ] Selected appropriate template
- [ ] Estimated time savings >30%

**After Completion:**
- [ ] All agents reported back
- [ ] Run consolidation verification
- [ ] No regressions introduced
- [ ] Document any new patterns discovered

---

## 📚 Learning Levels

### 101: Fundamentals (15-minute read)

#### What is Parallel Agent Orchestration?

**Definition:** Deploying multiple specialized AI agents simultaneously to complete independent subtasks of a larger goal, then consolidating their results.

**Real Example:**
```
Sequential: Update WooCommerce deps (2h) → Update types (2h) → Update testing libs (2h) = 6 hours
Parallel:   All three agents work simultaneously = 2 hours total (67% savings)
```

#### When NOT to Use Parallel Agents

**Anti-patterns (Sequential is Better):**
- ❌ **Debugging complex issues** - Requires iterative investigation
- ❌ **Architecture design** - Needs holistic thinking
- ❌ **Tasks <15 minutes** - Overhead exceeds benefits
- ❌ **Dependent operations** - Output of one feeds into next
- ❌ **Shared file modifications** - Creates merge conflicts

#### Basic 2-Agent Scenario Walkthrough

**Scenario:** Fix brand-agnostic violations while creating test helpers

**Step 1: Identify Independent Tasks**
```
Task A: Fix hardcoded brands in lib/, app/, components/ (production code)
Task B: Create Supabase test helpers in test-utils/
→ No shared files = Can parallelize ✅
```

**Step 2: Deploy Agents**
```typescript
// Single message, multiple Task tool invocations
Task({
  subagent_type: 'the-fixer',
  description: 'Fix brand violations in production code',
  prompt: 'Find and fix all hardcoded company names in lib/, app/, components/...'
});

Task({
  subagent_type: 'code-helper',
  description: 'Create Supabase test helpers',
  prompt: 'Create reusable test helpers for Supabase mocking...'
});
```

**Step 3: Verify Results**
```bash
npm run build  # Both changes compile?
npm test       # Tests still pass?
npm run lint   # No new violations?
```

**Result:** 5 hours reduced to 2.5 hours (50% savings)

#### Common Mistakes to Avoid

1. **🚫 Overlapping File Sets**
   ```
   Bad:  Agent 1 modifies lib/api.ts, Agent 2 also modifies lib/api.ts
   Good: Agent 1 modifies lib/, Agent 2 modifies app/
   ```

2. **🚫 Vague Success Criteria**
   ```
   Bad:  "Improve the tests"
   Good: "Create 20 tests achieving 80% coverage for organization routes"
   ```

3. **🚫 Missing Verification**
   ```
   Bad:  Assume agents' work is correct
   Good: Run build, tests, and lint after consolidation
   ```

#### Self-Assessment: 101 Level

- [ ] I understand what parallel orchestration is
- [ ] I can identify when NOT to use it
- [ ] I can spot independent vs dependent tasks
- [ ] I know how to deploy 2 agents in parallel
- [ ] I understand the importance of verification

**Practice Scenario:**
"You need to update React dependencies and fix TypeScript errors. Can these be parallelized? Why or why not?"

<details>
<summary>Answer</summary>

**Yes, they can be parallelized:**
- Different domains (package.json vs .ts files)
- No shared modifications
- Independent verification possible
- Both tasks >15 minutes

Deploy:
- Agent 1: Update React deps, verify build
- Agent 2: Fix TypeScript errors, verify tsc --noEmit
</details>

---

### 201: Intermediate (30-minute read)

#### 3+ Agent Coordination

**When to Deploy 3+ Agents:**
- Multiple independent domains (API, UI, tests)
- Large-scale pattern application
- Cross-module refactoring
- Comprehensive test creation

**Example: 3-Agent Test Creation**
```
Week 3 Real Deployment:
├─ Agent 1: Domain-agnostic agent tests (AI logic)
├─ Agent 2: Shopify integration tests (e-commerce)
└─ Agent 3: Organization route tests (API)

Result: 113 tests created in 6 hours (vs 18 hours sequential)
```

#### Task Decomposition Techniques

**The DICE Framework:**

**D**omain - Can you split by business domain?
```
✅ Authentication | Billing | Analytics
❌ All mixed together in same files
```

**I**ndependence - Do tasks share files?
```
✅ lib/auth/* | lib/billing/* | lib/analytics/*
❌ All modify lib/core.ts
```

**C**riteria - Can success be measured independently?
```
✅ Auth tests pass | Billing tests pass | Analytics tests pass
❌ Need to see all results before knowing if successful
```

**E**ffort - Is parallelization worth it?
```
✅ Each task >2 hours, total savings >30%
❌ Each task <30 minutes, overhead exceeds benefit
```

#### Communication Protocols

**Structured Agent Mission:**
```markdown
## Agent Mission: [DOMAIN NAME]

### Your Responsibility
[1 sentence clear scope]

### Tasks (Ordered)
1. Analyze: [What to examine]
2. Implement: [What to create/modify]
3. Verify: [How to validate success]

### Success Metrics
- [ ] Metric 1: [Measurable outcome]
- [ ] Metric 2: [Measurable outcome]

### Report Format
✅ Completed: [List with metrics]
❌ Failed: [List with reasons]
📊 Stats: [Time, LOC, files]
```

**Consolidated Report Structure:**
```markdown
## Week Summary

| Agent | Domain | Tasks | Files | Time | Status |
|-------|--------|-------|-------|------|--------|
| 1 | Auth | 5 | 12 | 2h | ✅ |
| 2 | Billing | 3 | 8 | 2h | ✅ |
| 3 | Analytics | 4 | 10 | 2h | ✅ |

**Combined Verification:**
- Build: ✅ Pass
- Tests: ✅ 147/147 passing
- Lint: ✅ 0 errors
```

#### Verification Strategies

**Layer 1: Agent Self-Verification**
Each agent runs before reporting:
```bash
npx tsc --noEmit        # Their changes compile?
npm test -- [their-tests] # Their tests pass?
npm run lint -- [files]  # Their files lint clean?
```

**Layer 2: Orchestrator Consolidation**
After all agents complete:
```bash
npm run build           # Everything compiles together?
npm test                # All tests still pass?
git status              # Check for conflicts
```

**Layer 3: Regression Check**
```bash
# Compare before/after metrics
npm test 2>&1 | grep -c "passing"  # Same or more?
npx tsc --noEmit 2>&1 | wc -l      # Same or fewer errors?
```

#### Self-Assessment: 201 Level

- [ ] I can decompose tasks using the DICE framework
- [ ] I can coordinate 3+ agents effectively
- [ ] I understand structured communication protocols
- [ ] I know the 3-layer verification strategy
- [ ] I can consolidate multi-agent reports

**Practice Scenario:**
"You need to: (1) Add TypeScript types to 20 JavaScript files, (2) Update all imports to use aliases, (3) Fix all resulting test failures. Design a 3-agent orchestration plan."

<details>
<summary>Answer</summary>

**3-Agent Plan:**

**Agent 1: TypeScript Migration**
- Add .ts extensions and basic types
- Verify: tsc --noEmit passes

**Agent 2: Import Alias Updates**
- Update all imports to use @/ aliases
- Verify: Build completes

**Agent 3: Test Fixing**
- Fix test failures from types/imports
- Verify: All tests pass

**Why this works:**
- Independent file operations
- Clear boundaries
- Measurable success criteria
- 3x time savings potential
</details>

---

### 301: Advanced (45-minute read)

#### Pattern Library

**1. Factory Pattern Orchestration**
```typescript
// Week 2: Created WooCommerce factory
// Week 3: Replicated for Shopify (100% consistency)

interface ClientFactory<T> {
  getConfigForDomain(domain: string): Promise<Config>;
  createClient(credentials: T): Client;
  decryptCredentials(encrypted: string): Promise<T>;
}

// Deploy pattern across integrations:
Agent 1: WooCommerce factory
Agent 2: Shopify factory
Agent 3: Stripe factory
→ All use identical interface structure
```

**2. Dependency Injection Pattern**
```typescript
// Transform for testability across codebase
// BEFORE: Hidden dependencies (hard to test)
class Provider {
  async fetch() {
    const client = await getClient(); // Hidden!
  }
}

// AFTER: Explicit dependencies (trivial to test)
class Provider {
  constructor(private client: Client) {} // Explicit!
  async fetch() {
    return this.client.get();
  }
}

// Orchestration:
Agent 1: Apply to lib/providers/*
Agent 2: Apply to lib/services/*
Agent 3: Update all tests
```

**3. React Hooks Exhaustive Deps Pattern**
```typescript
// Fix all useEffect warnings systematically
const handler = useCallback((event) => {
  // Use closure variables
  process(sessionId, data);
}, [sessionId, data]); // Add ALL deps

// Orchestration:
Agent 1: Fix app/admin/* and app/dashboard/*
Agent 2: Fix components/*
Agent 3: Fix lib/hooks/*
→ Result: 17 warnings → 0 in 1.5 hours
```

#### Haiku vs Opus Model Selection

**Decision Matrix:**

| Scenario | Use Haiku | Use Opus | Why |
|----------|-----------|----------|-----|
| **Applying known pattern** | ✅ | ❌ | No decisions needed, just application |
| **Creating architecture** | ❌ | ✅ | Requires deep reasoning |
| **Fixing lint/type errors** | ✅ | ❌ | Solutions are deterministic |
| **Debugging complex issue** | ❌ | ✅ | Needs investigation and reasoning |
| **Systematic refactoring** | ✅ | ❌ | Pattern is clear, just needs execution |
| **Creating comprehensive tests** | ❌ | ✅ | Needs to understand edge cases |

**Cost-Benefit Analysis:**
```
React Hooks Fix (17 files):
Haiku:  3 agents × $0.50 = $1.50, 1.5 hours
Opus:   3 agents × $5.00 = $15.00, 2.5 hours
Savings: $13.50 (90% cost), 1 hour (40% time)
Quality: Identical (100% success rate)
```

#### Context Protection Strategies

**1. Structured Over Narrative**
```markdown
❌ BAD: Long paragraph describing what was done
✅ GOOD:
| Task | Status | Metrics |
|------|--------|---------|
| Update deps | ✅ | 15 packages |
| Fix types | ✅ | 23 files |
```

**2. Reference Files, Not Descriptions**
```markdown
❌ BAD: "Use the factory pattern we discussed earlier"
✅ GOOD: "Follow pattern in lib/woocommerce-api/factory.ts"
```

**3. Use Templates for Consistency**
```markdown
Every agent gets:
- Same report structure
- Same metric format
- Same verification checklist
→ Easy parsing, minimal tokens
```

#### Custom Template Creation

**Template Components:**

```markdown
# [AGENT TYPE]: [Domain]

## 1. Context (2-3 lines max)
Role + Tools + Scope

## 2. Mission (1-2 lines)
Clear, measurable objective

## 3. Tasks (ordered, specific)
1. Action → Success criteria
2. Action → Success criteria
3. Verify → Pass/fail criteria

## 4. Requirements
✅ DO: [Specific positive actions]
❌ DON'T: [Specific prohibitions]

## 5. Contingencies
IF [problem] THEN [solution] ELSE [fallback]

## 6. Report Template
[Exact format expected back]
```

**Creating Domain-Specific Templates:**

Example for your codebase:
```markdown
# E-commerce Integration Specialist

Reusable for: WooCommerce, Shopify, Stripe, Square
Pattern: Factory + DI + Test helpers
Success: Integration works with 100% test coverage
```

#### Self-Assessment: 301 Level

- [ ] I can create custom templates for my domain
- [ ] I know when to use Haiku vs Opus models
- [ ] I can protect context with structured communication
- [ ] I understand pattern propagation across agents
- [ ] I can orchestrate 4+ agents efficiently

**Practice Scenario:**
"Design a 4-agent orchestration to migrate your entire test suite from Jest mock patterns to dependency injection. Consider model selection, context protection, and verification strategy."

<details>
<summary>Answer</summary>

**4-Agent Orchestration Plan:**

**Model Selection:** Haiku (applying known DI pattern)

**Agent Deployment:**
1. API route tests (150 files)
2. Component tests (100 files)
3. Service tests (80 files)
4. Integration tests (50 files)

**Context Protection:**
- Reference: "Apply pattern from test-utils/di-helpers.ts"
- Report: Tables only, no narratives
- Verification: Count of jest.mock() calls before/after

**Expected Result:**
- 380 test files updated
- 90% reduction in mock complexity
- 6 hours (vs 24 sequential)
- Cost: $2 (vs $20 with Opus)
</details>

---

## 🎯 Scenario Playbooks

### Scenario 1: "Update 20+ Dependencies"

**Trigger:** Package.json has outdated dependencies across multiple categories

**Orchestration Plan:**
```yaml
Agent Count: 4
Model: Haiku (no architecture decisions needed)
Time Savings: 88-92%
Parallel Structure:
  Agent 1: Database packages (@supabase/*, pg, redis)
  Agent 2: Type definitions (@types/*)
  Agent 3: Testing libraries (jest, testing-library, msw)
  Agent 4: Build tools (next, react, typescript, webpack)
```

**Example Prompt:**
```markdown
You are responsible for updating database-related packages.

## Your Mission
Update all @supabase/*, pg, and Redis packages to latest versions.

## Tasks
1. Update packages in package.json
2. Run npm install
3. Fix any breaking changes
4. Verify build and tests pass

## Success Criteria
- All database packages on latest versions
- No TypeScript errors
- All database tests passing
```

**Verification:**
```bash
npm run build && npm test && npm run lint
```

---

### Scenario 2: "Refactor 30+ Files for Code Standards"

**Trigger:** Multiple files violate 300 LOC limit or have code quality issues

**Orchestration Plan:**
```yaml
Agent Count: 3
Model: Opus (needs refactoring decisions)
Time Savings: 60-75%
Parallel Structure:
  Agent 1: API routes (app/api/*)
  Agent 2: Components (components/*)
  Agent 3: Services (lib/services/*)
```

**Example Prompt:**
```markdown
You are responsible for refactoring components/ directory.

## Your Mission
Refactor all files >300 LOC into smaller, focused modules.

## Requirements
- Extract logical units into separate files
- Maintain all exports and APIs
- Update imports across codebase
- Each resulting file <300 LOC

## Verification
- All components render correctly
- Component tests pass
- No circular dependencies
```

---

### Scenario 3: "Create Comprehensive Test Suite"

**Trigger:** New feature completed without tests

**Orchestration Plan:**
```yaml
Agent Count: 2-3
Model: Opus (needs edge case reasoning)
Time Savings: 40-50%
Parallel Structure:
  Agent 1: Unit tests (pure functions, utilities)
  Agent 2: Integration tests (API, database)
  Agent 3: Component tests (if UI involved)
```

**Example Prompt:**
```markdown
You are responsible for unit tests.

## Your Mission
Create comprehensive unit tests for all pure functions in lib/new-feature/*

## Coverage Requirements
- 90% line coverage minimum
- Test happy paths
- Test error conditions
- Test edge cases (null, undefined, empty)
- Test boundary conditions

## Success Criteria
- All tests pass
- Coverage >90%
- Tests run in <5 seconds total
```

---

### Scenario 4: "Fix All ESLint/TypeScript Errors"

**Trigger:** Build blocked by linting or type errors

**Orchestration Plan:**
```yaml
Agent Count: 3
Model: Haiku (deterministic fixes)
Time Savings: 70-80%
Parallel Structure:
  Agent 1: Unused variables and imports
  Agent 2: Type inference and any types
  Agent 3: Formatting and code style
```

---

### Scenario 5: "Database Schema Expansion"

**Trigger:** Need multiple new tables with relationships

**Orchestration Plan:**
```yaml
Agent Count: 2-3
Model: Opus (architecture decisions)
Time Savings: 50-60%
Parallel Structure:
  Agent 1: Core tables and relationships
  Agent 2: Indexes and performance optimization
  Agent 3: RLS policies and security
```

---

## 📖 Agent Prompt Templates

### Quick Template Selection

| Need | Template | Jump to |
|------|----------|---------|
| **Refactor code** | [Code Refactoring Template](#code-refactoring-template) | ↓ |
| **Create tests** | [Test Creation Template](#test-creation-template) | ↓ |
| **Database work** | [Database Migration Template](#database-migration-template) | ↓ |
| **Apply pattern** | [Pattern Application Template](#pattern-application-template) | ↓ |
| **Fix errors** | [Error Fixing Template](#error-fixing-template) | ↓ |

### Code Refactoring Template

```markdown
# Code Refactoring Agent: [DOMAIN]

## Context
You are a specialized refactoring agent responsible for [SPECIFIC GOAL].
You have access to: Read, Write, Edit, Bash, Glob, Grep

## Your Mission
Refactor [TARGET] to achieve [GOAL] while maintaining 100% backward compatibility.
Success = [MEASURABLE OUTCOME]

## Tasks (Execute in Order)
1. Analyze current implementation
   - Read target files: [LIST]
   - Document patterns
   - Note existing tests

2. Implement refactoring
   - Create new structure
   - Maintain APIs
   - Add comments

3. Verify changes
   - Run build
   - Run tests
   - Check types

## Critical Requirements
✅ DO: Maintain backward compatibility
✅ DO: Keep files <300 LOC
❌ DON'T: Break existing APIs
❌ DON'T: Skip verification

## Report Format
### Summary
[What was refactored]

### Files Modified
- path/file.ts (XXX LOC)

### Verification
- Build: ✅/❌
- Tests: X/Y passing
- Types: ✅/❌
```

### Test Creation Template

```markdown
# Test Creation Agent: [DOMAIN]

## Context
You are a specialized testing agent for [DOMAIN].
You have access to: Read, Write, Bash

## Your Mission
Create comprehensive tests achieving [X]% coverage.
Success = All tests passing with coverage target met.

## Tasks (Execute in Order)
1. Analyze code to test
   - Document all functions
   - Identify edge cases
   - Note dependencies

2. Create test suite
   - Happy paths
   - Error cases
   - Edge cases
   - Boundary conditions

3. Verify coverage
   - Run tests
   - Check coverage
   - Ensure <5s runtime

## Test Structure
describe('[Component]', () => {
  it('should [behavior] when [condition]', () => {
    // Arrange
    // Act
    // Assert
  });
});

## Report Format
### Tests Created
- Happy paths: X tests
- Error handling: Y tests
- Edge cases: Z tests

### Coverage
- Lines: X%
- Branches: Y%
- Functions: Z%
```

### Database Migration Template

```markdown
# Database Migration Agent: [TABLES]

## Context
You are a specialized database agent for Supabase.
You have access to: Supabase MCP tools, Read, Write

## Your Mission
Create migration for [FEATURE] with RLS, indexes, and types.
Success = Migration applies cleanly with security enforced.

## Tasks (Execute in Order)
1. Analyze schema requirements
   - Read REFERENCE_DATABASE_SCHEMA.md
   - Note naming conventions
   - Plan relationships

2. Create migration
   - Table structure
   - Foreign keys
   - Indexes (1 per FK minimum)
   - RLS policies
   - Helper functions

3. Update types
   - types/supabase.ts
   - Match schema exactly

## SQL Patterns
-- RLS for multi-tenant
CREATE POLICY "org_isolation"
ON table FOR SELECT
USING (org_id IN (
  SELECT org_id FROM user_orgs
  WHERE user_id = auth.uid()
));

## Report Format
### Migration Created
- Tables: X
- Indexes: Y
- RLS Policies: Z
- File: migrations/[timestamp]_[name].sql
```

### Pattern Application Template

```markdown
# Pattern Application Agent: [PATTERN NAME]

## Context
You are applying [PATTERN] across [DOMAIN].
You have access to: Read, Write, Edit, Bash

## Your Mission
Apply [PATTERN] to all files matching [CRITERIA].
Success = Pattern uniformly applied, all tests pass.

## Pattern to Apply
### BEFORE:
[code example before]

### AFTER:
[code example after]

## Files to Process
[List or glob pattern]

## Verification
- Pattern applied: X files
- Tests pass: ✅
- Build success: ✅

## Report Format
### Files Modified
[List with line counts]

### Verification
- Files processed: X
- Pattern applied: Y times
- All tests passing: ✅/❌
```

### Error Fixing Template

```markdown
# Error Fixing Agent: [ERROR TYPE]

## Context
You are fixing [ERROR TYPE] errors in [DOMAIN].
You have access to: Read, Write, Edit, Bash

## Your Mission
Fix all [ERROR TYPE] errors/warnings.
Success = 0 errors of this type remaining.

## Current Errors
[Paste error output or description]

## Fix Strategy
1. Identify root cause
2. Apply systematic fix
3. Verify no new errors introduced

## Common Fixes
- Error Type A: [Solution]
- Error Type B: [Solution]

## Verification
npm run lint | grep "[ERROR TYPE]" | wc -l
# Should return 0

## Report Format
### Errors Fixed
- Total: X errors
- Files modified: Y

### Verification
- Lint clean: ✅/❌
- Build passes: ✅/❌
- Tests pass: ✅/❌
```

---

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Agent Reports Incomplete Results

**Cause:** Prompt was ambiguous or missing success criteria

**Fix:** Use verification checklist in prompt
```markdown
## Verification Checklist
- [ ] All files processed
- [ ] Tests written for each function
- [ ] Coverage >90%
- [ ] No lint errors
```

**Prevention:** Always include measurable success criteria

---

#### Issue 2: Agents Modify Same Files

**Cause:** Poor task decomposition, overlapping domains

**Fix:** Run file ownership check before deployment
```bash
# Check for file overlap
echo "Agent 1 files:" && ls lib/auth/
echo "Agent 2 files:" && ls lib/auth/  # Should be different!
```

**Prevention:** Use DICE framework for decomposition

---

#### Issue 3: Different Agents, Different Patterns

**Cause:** No reference to existing patterns

**Fix:** Include pattern reference in all agent prompts
```markdown
Follow the factory pattern from lib/woocommerce-api/factory.ts
```

**Prevention:** Maintain pattern library, reference in prompts

---

#### Issue 4: Merge Conflicts After Parallel Work

**Cause:** Hidden file dependencies

**Fix:**
1. Identify conflicting files
2. Manually merge changes
3. Re-run verification

**Prevention:** Explicit file ownership declaration upfront

---

#### Issue 5: Agent Costs Exceeding Budget

**Cause:** Using Opus for pattern application

**Fix:** Switch to Haiku for deterministic tasks
```
Pattern application: Use Haiku ($0.50 vs $5)
Architecture design: Keep Opus
```

**Prevention:** Consult model selection matrix

---

## 📊 Quick Reference Tables

### Time Savings by Scenario

| Task Type | Sequential | Parallel | Agents | Savings |
|-----------|------------|----------|--------|---------|
| Update 20 dependencies | 6h | 45min | 4 | 88% |
| Refactor 30 files | 10h | 3h | 3 | 70% |
| Create 100 tests | 8h | 3h | 3 | 63% |
| Fix 50 lint errors | 4h | 1h | 3 | 75% |
| Apply pattern to codebase | 6h | 2h | 3 | 67% |

### Model Selection Matrix

| Task Type | Haiku | Opus | Cost Difference |
|-----------|-------|------|-----------------|
| Apply known pattern | ✅ | ❌ | 90% cheaper |
| Fix deterministic errors | ✅ | ❌ | 90% cheaper |
| Create architecture | ❌ | ✅ | Worth the cost |
| Debug complex issue | ❌ | ✅ | Worth the cost |
| Write comprehensive tests | ❌ | ✅ | Worth the cost |

### Parallelization Checklist

| Criterion | Good for Parallel | Bad for Parallel |
|-----------|-------------------|-------------------|
| Task size | >2 hours each | <30 minutes each |
| File overlap | No shared files | Many shared files |
| Dependencies | Independent | Output feeds next |
| Verification | Can self-verify | Needs integration |
| Domain | Clear boundaries | Mixed concerns |

### Communication Token Optimization

| Method | Token Usage | Efficiency |
|--------|-------------|------------|
| Narrative reports | High (1000+ tokens) | ❌ Poor |
| Structured tables | Low (200-300 tokens) | ✅ Good |
| File references | Minimal (50 tokens) | ✅ Excellent |
| Template reports | Predictable (300 tokens) | ✅ Good |

---

## Summary

### Key Takeaways

1. **Parallel orchestration saves 40-90% time** when tasks are truly independent
2. **Use Haiku for patterns, Opus for reasoning** (90% cost savings on deterministic tasks)
3. **Structure beats narrative** in agent communication
4. **Verify at boundaries, not continuously** to reduce overhead
5. **Templates ensure consistency** across all agents

### Your Next Steps

1. **Start with 2 agents** on your next refactoring task
2. **Use the decision flowchart** to validate parallelization
3. **Pick a template** from this guide
4. **Measure results** and update this guide with learnings
5. **Graduate to 3+ agents** once comfortable

### Success Metrics to Track

- Time saved vs sequential approach
- Quality (tests passing, no regressions)
- Cost (Haiku vs Opus usage)
- Pattern reuse across agents

---

## Appendix: Links to Extended Resources

- **[Full Case Study Archive](../10-ANALYSIS/ANALYSIS_PARALLEL_AGENT_ORCHESTRATION.md)** - 4-week execution with detailed logs
- **[CLAUDE.md Agent Section](../../CLAUDE.md#agent-orchestration--parallelization)** - Official orchestration rules
- **[Agent Prompt Templates](.claude/AGENT_PROMPT_TEMPLATES.md)** - Additional specialized templates

---

*Transform your development workflow with parallel agent orchestration. Start with 2 agents today and scale to 4+ as you build confidence.*