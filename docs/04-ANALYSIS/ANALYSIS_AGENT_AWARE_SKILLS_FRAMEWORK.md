# Agent-Aware Skills Framework

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-10-31
**Purpose:** Design framework for skills that spawn specialized agents to protect orchestrator context and improve efficiency

## Executive Summary

Skills should be "agent factories" that spawn specialized sub-agents with domain expertise. This protects the main orchestrator's context window, improves efficiency through delegation, and provides consistent patterns for complex workflows.

**Key Insight:** When I (the orchestrator) invoke a skill, I should be able to delegate the entire task to a specialized agent who has all the domain knowledge, validation scripts, and code patterns baked in.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [The Agent-Aware Skill Pattern](#the-agent-aware-skill-pattern)
3. [Framework Design](#framework-design)
4. [Skill Proposals](#skill-proposals)
5. [Implementation Guidelines](#implementation-guidelines)

---

## Current State Analysis

### Existing Agent: code-researcher

**Location:** `.claude/agents/code-researcher.md`

**Pattern Analysis:**
- ✅ Well-defined scope (code research only)
- ✅ Clear methodology (4 phases)
- ✅ Specific output format
- ✅ Search strategies documented
- ❌ No embedded validation scripts
- ❌ No code snippet library
- ❌ No sub-agent spawning capability

**What It Does Well:**
- Provides comprehensive research methodology
- Documents search patterns
- Structures output for reusability

**What It Could Improve:**
- Include validation scripts (e.g., "verify all references exist")
- Add code snippets for common patterns
- Define when to spawn sub-agents for parallel research

### Built-in Claude Code Skills

From system context, these skills exist:
- `theme-factory` - Styling artifacts
- `algorithmic-art` - p5.js art generation
- `canvas-design` - Visual design
- `artifacts-builder` - Complex HTML artifacts
- `skill-creator` - Creating new skills
- `mcp-builder` - MCP server creation
- `webapp-testing` - Playwright testing

**Observation:** These are general-purpose skills. None are specific to this codebase's needs (refactoring, optimization, file placement, etc.).

---

## The Agent-Aware Skill Pattern

### Core Concept

A skill should:
1. **Have domain expertise** - All project conventions, patterns, rules
2. **Spawn specialized agents** - Delegate work to protect orchestrator context
3. **Include validation tools** - Scripts to verify success
4. **Provide code snippets** - Reusable patterns and templates
5. **Define clear success criteria** - Testable outcomes

### When to Use Specialized Agents in Skills

**Always spawn an agent when:**
- ✅ Task involves reading 5+ files
- ✅ Task has repetitive operations (refactoring 10+ files)
- ✅ Task requires domain expertise (SOLID principles, security patterns)
- ✅ Task generates >5,000 tokens of output
- ✅ Orchestrator's context is >60% full

**Handle in skill directly when:**
- ❌ Quick decision (<2 minutes)
- ❌ Interactive clarification needed
- ❌ Single file operation
- ❌ Tight sequential dependencies

### Benefits of Agent-Aware Skills

| Benefit | Impact |
|---------|--------|
| **Context Protection** | Orchestrator stays under 50% context usage |
| **Consistency** | Agent knows all project rules/patterns |
| **Efficiency** | Parallel agent execution |
| **Reusability** | Same skill works across projects |
| **Validation** | Built-in success verification |

---

## Framework Design

### Skill Structure Template

```markdown
# Skill Name

**Purpose:** [1-2 sentences]
**When to Use:** [Trigger conditions]
**Context Protection:** [How this protects orchestrator context]

---

## Specialized Agents

### Agent: [agent-name]

**Expertise:**
- [Domain knowledge 1]
- [Domain knowledge 2]
- [Domain knowledge 3]

**Knowledge Includes:**
- Project conventions from CLAUDE.md
- Language-specific best practices
- Testing requirements
- [Skill-specific expertise]

**Mission Template:**
```
You are a [specialized role] agent.

## Your Expertise
[List all domain knowledge]

## Your Mission
[Specific objective]

## Success Criteria
1. [Testable criterion 1]
2. [Testable criterion 2]

## Required Validation
- Run: `[command]` (must pass)
- Verify: [specific outcome]

## Report Format
- ✅ Successes
- ❌ Failures
- 🧪 Test results
- 📊 Metrics

## Code Patterns Available
[Reference to code snippets section]

## If You Encounter Issues
[Decision criteria and escalation path]
```
```

---

## Code Snippets Library

[Include reusable code patterns]

```typescript
// Pattern 1: [Description]
[Code example]

// Pattern 2: [Description]
[Code example]
```

---

## Validation Scripts

### Script: validate-[task].sh

```bash
#!/bin/bash
# Validates [specific thing]
# Usage: ./validate-[task].sh [args]

[Script implementation]
```

---

## Decision Framework

### Use Agent When:
- [Condition 1]
- [Condition 2]

### Handle Directly When:
- [Condition 1]
- [Condition 2]

---

## Usage Examples

### Example 1: [Scenario]
```
User: [Request]
Skill: [Response with agent spawn]
Agent: [Action taken]
Result: [Outcome]
```

### Example 2: [Scenario]
```
[Another example]
```

---

## Integration with Orchestrator

**How Orchestrator Uses This Skill:**

1. Recognizes trigger condition
2. Invokes skill with context
3. Skill spawns specialized agent
4. Agent completes work + validation
5. Agent reports back
6. Skill consolidates for orchestrator
7. Orchestrator retains only summary

**Context Flow:**
```
Orchestrator (10% context used)
    ↓ Invokes skill
Skill Agent (spawned fresh, 0% context)
    ↓ Completes work
Agent Report (structured, compact)
    ↓ Consolidate
Orchestrator (15% context used) ← Only 5% added!
```

---
```

---

## Skill Proposals

### 1. refactoring-specialist

**Extract from:** CLAUDE.md "FILE LENGTH" + "TESTING & CODE QUALITY PHILOSOPHY"

**Purpose:** Automatically refactor files >300 LOC with SOLID principles

**Specialized Agent:** `refactoring-agent`

**Agent Knowledge:**
- STRICT 300 LOC limit
- SOLID principles (especially Dependency Inversion)
- Project patterns from CLAUDE.md
- TypeScript best practices
- Testing requirements (trivial mocks = good design)

**Code Snippets:**
```typescript
// Pattern: Dependency Injection for Testability
// BEFORE: Hard to test
class Service {
  constructor() {
    this.client = new ExternalClient(); // Hidden dependency
  }
}

// AFTER: Easy to test
class Service {
  constructor(private client: ExternalClient) {} // Explicit dependency
}

// Pattern: Extract to Module
// BEFORE: 450 LOC file
// AFTER: 4 files of 110 LOC each with clear responsibilities
```

**Validation Scripts:**
```bash
#!/bin/bash
# validate-refactoring.sh
# Checks: LOC limits, tests pass, no type errors

echo "Checking LOC limits..."
find . -name "*.ts" -exec wc -l {} \; | awk '$1 > 300 {print "❌ " $2 " has " $1 " lines"}'

echo "Running tests..."
npm test -- --findRelatedTests $1

echo "Checking types..."
npx tsc --noEmit
```

**When to Use:**
- File exceeds 300 LOC
- Complex logic with tight coupling
- Tests require extensive mocking
- "Hard to test" = "poorly designed" scenario

---

### 2. file-placement-enforcer

**Extract from:** CLAUDE.md "🚨 CRITICAL: FILE PLACEMENT RULES 🚨"

**Purpose:** Ensure files are created in correct locations, never in root

**Specialized Agent:** `file-placement-agent`

**Agent Knowledge:**
- Complete file placement decision tree
- Directory categorization rules
- Naming conventions
- Enforcement patterns

**Code Snippets:**
```typescript
// Pattern: Validate File Path Before Creation
function validateFilePath(filePath: string, fileType: string): { valid: boolean; correctPath?: string } {
  const rules = {
    'test-script': '__tests__/',
    'utility-script': 'scripts/',
    'sql-script': 'scripts/sql/',
    'completion-report': 'ARCHIVE/completion-reports-YYYY-MM/',
    // ... more rules
  };

  // Validation logic
}
```

**Validation Scripts:**
```bash
#!/bin/bash
# validate-file-placement.sh
# Checks: No files in root (except whitelist), proper categorization

ALLOWED_ROOT=(
  "package.json" "package-lock.json"
  "tsconfig.json" "next.config.js"
  "README.md" "CLAUDE.md"
  # ... full whitelist
)

# Check for forbidden root files
for file in *; do
  if [[ -f "$file" ]] && [[ ! " ${ALLOWED_ROOT[@]} " =~ " ${file} " ]]; then
    echo "❌ Forbidden root file: $file"
    exit 1
  fi
done

echo "✅ File placement validated"
```

**When to Use:**
- Creating ANY new file
- Moving/organizing files
- Auditing project structure

---

### 3. docs-standards-validator

**Extract from:** CLAUDE.md "Documentation Standards for AI Discoverability"

**Purpose:** Create/validate documentation with proper metadata, naming, structure

**Specialized Agent:** `docs-standards-agent`

**Agent Knowledge:**
- File naming conventions (PREFIX_DESCRIPTIVE_NAME.md)
- Metadata header requirements
- Directory structure (01-ARCHITECTURE, 02-GUIDES, etc.)
- Cross-reference patterns
- TOC requirements
- Keyword optimization

**Code Snippets:**
```markdown
<!-- Template: Documentation Header -->
# Document Title

**Type:** [Architecture | Guide | Reference | Analysis]
**Status:** [Active | Draft | Deprecated]
**Last Updated:** YYYY-MM-DD
**Verified For:** vX.X.X
**Dependencies:** [Related docs]
**Estimated Read Time:** X minutes

## Purpose
[1-2 sentence summary]

## Quick Links
- [Related Doc 1](../path/to/doc.md)
- [Related Doc 2](../path/to/doc.md)

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

---
```

**Validation Scripts:**
```bash
#!/bin/bash
# validate-docs-standards.sh
# Checks: Proper naming, metadata headers, cross-references, TOC

echo "Validating documentation standards..."

for doc in docs/**/*.md; do
  # Check naming convention
  basename=$(basename "$doc")
  if [[ ! "$basename" =~ ^[A-Z]+_[A-Z_]+\.md$ ]]; then
    echo "❌ Invalid filename: $doc (must be PREFIX_NAME.md)"
  fi

  # Check metadata header
  if ! grep -q "^**Type:**" "$doc"; then
    echo "❌ Missing metadata header: $doc"
  fi

  # Check for broken cross-references
  grep -o '\[.*\](.*\.md[^)]*)' "$doc" | while read link; do
    # Validate link exists
  done
done

echo "✅ Documentation standards validated"
```

**When to Use:**
- Creating any documentation
- Updating existing docs
- Auditing doc quality

---

### 4. optimization-reviewer

**Extract from:** CLAUDE.md "Optimization Philosophy" + "Performance Guidelines"

**Purpose:** Review code for performance issues, algorithmic complexity, async opportunities

**Specialized Agent:** `optimization-agent`

**Agent Knowledge:**
- Algorithmic complexity patterns (O(n²) → O(n))
- Async/parallel processing opportunities
- Database query optimization
- Bundle size optimization
- Resource efficiency patterns

**Code Snippets:**
```typescript
// Pattern: O(n²) → O(n) with Map
// BEFORE: O(n²)
const matched = items.filter(item =>
  otherItems.find(other => other.id === item.parentId)
);

// AFTER: O(n)
const otherMap = new Map(otherItems.map(o => [o.id, o]));
const matched = items.filter(item => otherMap.has(item.parentId));

// Pattern: Sequential → Parallel
// BEFORE: Sequential (2x time)
const a = await fetchA();
const b = await fetchB();

// AFTER: Parallel (1x time)
const [a, b] = await Promise.all([fetchA(), fetchB()]);

// Pattern: Database N+1 Query → Batch Fetch
// BEFORE: N+1 queries
for (const user of users) {
  const posts = await db.query('SELECT * FROM posts WHERE user_id = ?', [user.id]);
}

// AFTER: 1 query
const userIds = users.map(u => u.id);
const allPosts = await db.query('SELECT * FROM posts WHERE user_id IN (?)', [userIds]);
const postsByUser = groupBy(allPosts, 'user_id');
```

**Validation Scripts:**
```bash
#!/bin/bash
# validate-performance.sh
# Checks: No O(n²), async patterns used, bundle size

echo "Checking for O(n²) patterns..."
grep -r "for.*in.*for.*in" --include="*.ts" --include="*.tsx"

echo "Checking for missed parallel opportunities..."
grep -r "await.*\nawait" --include="*.ts" --include="*.tsx"

echo "Checking bundle size..."
npm run build
du -sh .next/static/chunks/*.js | awk '$1 > 500K {print "⚠️  Large chunk: " $2}'

echo "✅ Performance validation complete"
```

**When to Use:**
- Code review before merge
- Performance optimization sprints
- After adding new features
- When response times slow down

---

### 5. brand-agnostic-checker

**Extract from:** CLAUDE.md "🚨 CRITICAL: BRAND-AGNOSTIC APPLICATION 🚨"

**Purpose:** Ensure no hardcoded business-specific data in production code

**Specialized Agent:** `brand-checker-agent`

**Agent Knowledge:**
- Multi-tenant architecture principles
- What must come from database vs. code
- Test exception rules
- Domain-specific terminology patterns

**Code Snippets:**
```typescript
// Pattern: Configuration from Database
// ❌ BAD: Hardcoded
const COMPANY_NAME = "Thompson's Pumps";
const PRODUCT_CATEGORIES = ["Hydraulic Pumps", "Motors"];

// ✅ GOOD: From database
const config = await db.query(
  'SELECT company_name, categories FROM customer_configs WHERE domain = ?',
  [domain]
);

// Pattern: Generic UI Text
// ❌ BAD: Industry-specific
<h1>Browse Our Pump Catalog</h1>

// ✅ GOOD: Generic
<h1>Browse Our Products</h1>

// Pattern: Test Data (ALLOWED)
// ✅ GOOD: Tests can use specific terminology
it('should find pumps when user asks about pumps', async () => {
  const result = await agent.query('Do you have any pumps?');
  expect(result.products).toBeDefined();
});
```

**Validation Scripts:**
```bash
#!/bin/bash
# validate-brand-agnostic.sh
# Checks: No hardcoded company/product names in production code

echo "Checking for hardcoded brand references..."

# Exclude test files
PROD_FILES=$(find app lib components -name "*.ts" -o -name "*.tsx" | grep -v "__tests__")

# Check for common violations
echo "$PROD_FILES" | xargs grep -i "thompson\|pump\|motor" && {
  echo "❌ Found hardcoded brand references in production code"
  exit 1
}

echo "✅ Brand-agnostic validation passed"
```

**When to Use:**
- Before committing production code
- Code review process
- Onboarding new developers

---

### 6. test-coverage-improver

**Purpose:** Automatically add missing tests for untested code

**Specialized Agent:** `test-coverage-agent`

**Agent Knowledge:**
- Jest testing patterns
- MSW mocking patterns
- Component testing with React Testing Library
- Integration test patterns
- Current project test conventions

**Code Snippets:**
```typescript
// Pattern: Component Test Template
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    // Test interaction
  });
});

// Pattern: Service Test with Dependency Injection
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: jest.Mocked<DependencyType>;

  beforeEach(() => {
    mockDependency = {
      method: jest.fn(),
    } as any;

    service = new ServiceName(mockDependency);
  });

  it('should perform operation', async () => {
    mockDependency.method.mockResolvedValue('result');

    const result = await service.operation();

    expect(result).toBe('result');
    expect(mockDependency.method).toHaveBeenCalled();
  });
});
```

**Validation Scripts:**
```bash
#!/bin/bash
# validate-test-coverage.sh
# Checks: Coverage thresholds met, all files have tests

echo "Running test coverage..."
npm run test:coverage

echo "Checking for untested files..."
find lib app -name "*.ts" -not -path "*/__tests__/*" | while read file; do
  test_file="${file%.ts}.test.ts"
  if [[ ! -f "$test_file" ]]; then
    echo "⚠️  No test file for: $file"
  fi
done
```

**When to Use:**
- After adding new features
- Before merge/deployment
- Coverage improvement sprints

---

### 7. dependency-updater

**Purpose:** Safely update npm dependencies with validation

**Specialized Agent:** `dependency-update-agent`

**Agent Knowledge:**
- Package categorization (Supabase, types, testing, utils)
- Breaking change patterns
- Verification commands
- Rollback procedures

**Code Snippets:**
```bash
# Pattern: Safe Dependency Update with Validation

# 1. Update package
npm install @supabase/supabase-js@latest

# 2. Check for breaking changes
npm outdated | grep supabase

# 3. Validate build
npm run build || { echo "Build failed, rolling back"; npm install @supabase/supabase-js@<previous-version>; exit 1; }

# 4. Run tests
npm test || { echo "Tests failed, rolling back"; npm install @supabase/supabase-js@<previous-version>; exit 1; }

# 5. Check types
npx tsc --noEmit || { echo "Type errors, rolling back"; npm install @supabase/supabase-js@<previous-version>; exit 1; }

echo "✅ Dependency updated successfully"
```

**Validation Scripts:**
```bash
#!/bin/bash
# validate-dependencies.sh
# Checks: All dependencies work together, no conflicts

echo "Validating dependencies..."

npm run lint || { echo "❌ Linting failed"; exit 1; }
npm run build || { echo "❌ Build failed"; exit 1; }
npm test || { echo "❌ Tests failed"; exit 1; }
npx tsc --noEmit || { echo "❌ Type errors"; exit 1; }

echo "✅ All dependencies validated"
```

**When to Use:**
- Regular dependency maintenance
- Security updates
- Version upgrades

---

## Implementation Guidelines

### Creating a New Agent-Aware Skill

**Step 1: Define Scope**
- What specific problem does this solve?
- When should it be triggered?
- What domain knowledge is needed?

**Step 2: Design Agent**
- What expertise does the agent need?
- What validation must it perform?
- What's the report format?

**Step 3: Add Code Snippets**
- Common patterns to reuse
- Anti-patterns to avoid
- Project-specific examples

**Step 4: Create Validation Scripts**
- Automated verification
- Success criteria checking
- Rollback procedures

**Step 5: Document Usage**
- Clear examples
- Decision framework
- Integration with orchestrator

### Best Practices

1. **Keep Agents Focused** - One domain of expertise per agent
2. **Always Include Validation** - Never accept work without proof
3. **Protect Context** - Agents should return compact reports
4. **Use Real Examples** - Code snippets from actual project
5. **Define Success Criteria** - Make them testable and specific

### Testing Your Skill

```bash
# 1. Create skill in .claude/skills/skill-name.md
# 2. Test invocation
#    - Does it spawn agent correctly?
#    - Does agent have all knowledge?
#    - Does validation work?
# 3. Measure impact
#    - Context usage before/after
#    - Time savings
#    - Success rate
```

---

## Integration with CLAUDE.md

### What Stays in CLAUDE.md

✅ Core principles
✅ Project overview
✅ Tech stack
✅ Basic commands
✅ Critical reminders (always relevant)

### What Moves to Skills

✅ Detailed workflows with checklists
✅ Domain-specific expertise
✅ Validation procedures
✅ Code pattern libraries
✅ Decision trees

### Estimated Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| CLAUDE.md size | ~2,800 lines | ~1,600 lines | 43% reduction |
| Context usage | 15-20% | 5-10% | 50-67% reduction |
| Agent efficiency | Manual delegation | Automatic | Consistent |
| Validation | Manual | Automated | 100% coverage |

---

## Next Steps

### Phase 1: Create Core Skills (High Priority)
1. Create `refactoring-specialist.md` skill
2. Create `file-placement-enforcer.md` skill
3. Create `docs-standards-validator.md` skill

### Phase 2: Optimization Skills (Medium Priority)
4. Create `optimization-reviewer.md` skill
5. Create `test-coverage-improver.md` skill
6. Create `dependency-updater.md` skill

### Phase 3: Validation Skills (Low Priority)
7. Create `brand-agnostic-checker.md` skill
8. Update CLAUDE.md with references to new skills
9. Document skill usage patterns

### Phase 4: Enhance Existing
10. Update `code-researcher.md` with validation scripts
11. Add code snippets to existing skills
12. Create skill orchestration guide

---

## Appendix: Skill Template

```markdown
# [Skill Name]

**Purpose:** [1-2 sentences]
**When to Use:** [Trigger conditions]
**Context Protection:** [How this protects orchestrator context]

---

## Specialized Agents

### Agent: [agent-name]

**Expertise:**
- [Domain knowledge item]
- [Domain knowledge item]

**Knowledge Includes:**
- Project conventions from CLAUDE.md
- [Skill-specific expertise]

**Mission Template:**
```
[Complete agent mission template with all sections]
```
```

---

## Code Snippets Library

```[language]
// Pattern: [Description]
[Code example]
```

---

## Validation Scripts

```bash
#!/bin/bash
# validate-[task].sh
[Script implementation]
```

---

## Decision Framework

### Use Agent When:
- [Condition]

### Handle Directly When:
- [Condition]

---

## Usage Examples

### Example: [Scenario]
```
[Example]
```

---

## Integration with Orchestrator

[How orchestrator uses this skill]
```

---

## References

- [CLAUDE.md](../../CLAUDE.md) - Project conventions and principles
- [code-researcher.md](../../.claude/agents/code-researcher.md) - Existing agent pattern
- [Agent Orchestration section](../../CLAUDE.md#agent-orchestration--parallelization) - Orchestration guidelines
