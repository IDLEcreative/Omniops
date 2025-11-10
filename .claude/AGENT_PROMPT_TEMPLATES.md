# Agent Prompt Templates

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-05
**Purpose:** Standardized prompt templates with built-in safeguards to prevent hallucination and extrapolation

## Overview

These templates enforce source fidelity, verification requirements, and clear boundaries for agent tasks. Use these templates when orchestrating agents to prevent common issues like extrapolation beyond sources.

---

## Template 1: Faithful Documentation from Source

**Use Case:** Creating documentation from a specific source (article, API docs, etc.)

```markdown
## Mission: Document [TOPIC] from [SOURCE]

### Critical Requirements
- ✅ ONLY include information explicitly stated in the source
- ✅ Quote key passages directly with quotes
- ✅ If you need to infer something, mark it clearly as [INFERRED: reasoning]
- ✅ If the source doesn't cover a topic, write "Not covered in source"
- ❌ DO NOT add information from your training data without marking it
- ❌ DO NOT extrapolate implementation details not in the source
- ❌ DO NOT add examples unless they appear in the source

### Your Tasks
1. Fetch/read: [SOURCE_URL or FILE_PATH]
2. Extract the following information:
   - [Specific topic 1]
   - [Specific topic 2]
   - [Specific topic 3]
3. Create document at: [TARGET_PATH]
4. Follow documentation standards from CLAUDE.md

### Document Structure
- Metadata header (Type, Status, Last Updated, Source URL)
- "Source Fidelity" section stating this doc only contains info from source
- Clear sections matching source structure
- Direct quotes for key concepts
- [INFERRED] tags for any extrapolation

### Verification Checklist
Before returning your work, verify:
- [ ] Every claim has a corresponding section in the source
- [ ] No implementation details added from general knowledge
- [ ] No ROI calculations unless source provides them
- [ ] No technology recommendations unless source mentions them
- [ ] All inferences are marked with [INFERRED: ]

### Final Report
Provide:
1. Summary of what was documented
2. List of topics the source DID cover
3. List of topics the source DID NOT cover (that might be expected)
4. Any ambiguities or unclear statements in the source
```

---

## Template 2: Codebase Analysis with Evidence

**Use Case:** Analyzing codebase for patterns, opportunities, or issues

```markdown
## Mission: Analyze [ASPECT] in Codebase

### Critical Requirements
- ✅ Cite specific files and line numbers for every claim
- ✅ Include code snippets as evidence
- ✅ Distinguish between "observed facts" and "recommendations"
- ✅ Quantify findings with actual measurements where possible
- ❌ DO NOT make claims without file evidence
- ❌ DO NOT estimate performance without profiling
- ❌ DO NOT suggest optimizations without current baseline

### Your Tasks
1. Search/read relevant files in: [DIRECTORIES]
2. Look for: [SPECIFIC PATTERNS OR ISSUES]
3. Document findings with evidence
4. Create analysis at: [TARGET_PATH]

### Evidence Requirements
For every finding, provide:
- **File location:** `path/to/file.ts:line_number`
- **Code snippet:** Actual code demonstrating the issue
- **Frequency:** How many instances exist
- **Impact:** Measured or estimated effect

### Analysis Structure
- **Observed Facts** - Things you can prove with code
- **Metrics** - Actual measurements (file sizes, complexity, etc.)
- **Inferences** - Logical conclusions marked as such
- **Recommendations** - Suggestions based on findings

### Verification Checklist
- [ ] Every claim has file:line citation
- [ ] Metrics are measured, not estimated
- [ ] Recommendations are clearly separate from facts
- [ ] Code snippets are accurate (copied, not paraphrased)
```

---

## Template 3: Implementation Research with Sources

**Use Case:** Researching how to implement a feature, integration, or pattern

```markdown
## Mission: Research [FEATURE/INTEGRATION]

### Critical Requirements
- ✅ Cite all sources (docs, articles, repos)
- ✅ Distinguish "official documentation" from "community patterns"
- ✅ Mark experimental/unproven approaches as [EXPERIMENTAL]
- ✅ Note version-specific information with versions
- ❌ DO NOT present community patterns as official recommendations
- ❌ DO NOT assume API behavior without checking docs
- ❌ DO NOT recommend approaches without understanding trade-offs

### Your Tasks
1. Read official documentation: [LINKS]
2. Check current codebase implementation (if exists)
3. Research community best practices
4. Document findings with source attribution
5. Create research doc at: [TARGET_PATH]

### Source Hierarchy
1. **Official Docs** - Primary source of truth
2. **Codebase Reality** - What actually exists in our code
3. **Community Patterns** - StackOverflow, blog posts, etc.
4. **Experimental Ideas** - Unproven but potentially valuable

### Research Structure
- **Official Approach** (from docs)
- **Our Current Implementation** (from codebase)
- **Alternatives Considered** (from community)
- **Recommended Path** (with reasoning)
- **Trade-offs** (pros/cons of each)

### Source Attribution Format
> "Quote from source"
> — [Source Name](URL), accessed 2025-11-05

### Verification Checklist
- [ ] Official docs checked for all APIs/features
- [ ] Version numbers noted where relevant
- [ ] Sources linked for all recommendations
- [ ] Trade-offs documented for each approach
```

---

## Template 4: Two-Agent Verification Pattern

**Use Case:** High-stakes tasks requiring validation (migrations, refactors, etc.)

```markdown
## Agent 1: Implementation Agent

[Use appropriate template from above]

## Agent 2: Verification Agent

### Mission: Verify Agent 1's Work

### Critical Requirements
- ✅ Check every claim against source/codebase
- ✅ Run verification commands (tests, builds, lints)
- ✅ Identify any extrapolations or unsupported claims
- ✅ Test implementation if code was generated
- ❌ DO NOT assume Agent 1 was correct
- ❌ DO NOT skip verification steps

### Your Tasks
1. Read Agent 1's output: [LOCATION]
2. For documentation tasks:
   - Re-fetch the original source
   - Verify every section exists in source
   - Check for extrapolations
   - Flag unsupported claims
3. For implementation tasks:
   - Run: npm run build
   - Run: npm run lint
   - Run: npm test
   - Check for regressions
4. Create verification report: [TARGET_PATH]

### Verification Report Structure
- **✅ Verified Claims** - What's accurate
- **⚠️ Unsupported Claims** - What needs citation
- **❌ Incorrect Claims** - What's wrong
- **🔧 Fixes Needed** - What must be corrected

### Final Decision
- [ ] APPROVED - Work is accurate and complete
- [ ] NEEDS REVISION - Issues found, Agent 1 should fix
- [ ] REJECTED - Significant problems, restart task
```

---

## Template 5: ROI/Impact Analysis with Measured Data

**Use Case:** Calculating business impact, cost savings, performance improvements

```markdown
## Mission: Calculate [METRIC] for [FEATURE/CHANGE]

### Critical Requirements
- ✅ Use ACTUAL measurements from production/staging
- ✅ Clearly mark estimates as [ESTIMATED] with methodology
- ✅ Provide confidence intervals for projections
- ✅ Document all assumptions
- ❌ DO NOT invent metrics
- ❌ DO NOT estimate without explaining methodology
- ❌ DO NOT present projections as facts

### Your Tasks
1. Gather baseline metrics:
   - Current performance: [MEASURE]
   - Current costs: [MEASURE]
   - Current usage: [MEASURE]
2. Calculate projected improvements
3. Document methodology and assumptions
4. Create analysis at: [TARGET_PATH]

### Data Collection
For each metric, specify:
- **Source:** Where data comes from (logs, analytics, database)
- **Method:** How it was measured
- **Timeframe:** Date range of measurement
- **Sample size:** How much data
- **Confidence:** High/Medium/Low

### Calculation Structure
```
Current State (MEASURED):
- Metric 1: X units (source: logs, measured 2025-10-01 to 2025-10-31)
- Metric 2: Y units (source: database query, measured 2025-11-01)

Projected State (ESTIMATED - methodology: similar feature in codebase):
- Metric 1: X * 0.5 units (assuming 50% reduction, based on [source])
- Confidence: Medium (based on limited historical data)

Assumptions:
1. Usage remains constant at current levels
2. Implementation performs similarly to [reference]
3. No major architectural changes needed
```

### Verification Checklist
- [ ] All "current state" metrics are measured, not estimated
- [ ] All estimates have documented methodology
- [ ] Assumptions are explicitly listed
- [ ] Confidence levels are realistic
- [ ] Sources are cited for all data
```

---

## Usage Guidelines

### When to Use Which Template

| Task Type | Template | Why |
|-----------|----------|-----|
| Document external article/docs | Template 1 | Prevents extrapolation beyond source |
| Analyze existing codebase | Template 2 | Requires evidence for claims |
| Research implementation approach | Template 3 | Enforces source attribution |
| Critical/high-risk tasks | Template 4 | Double verification prevents errors |
| Business impact analysis | Template 5 | Ensures data-driven decisions |

### Red Flags Indicating You Need These Templates

- Agent adding implementation details not in source
- Claims without file/line citations
- ROI calculations appearing out of nowhere
- Technology recommendations without source
- "Best practices" without attribution
- Performance claims without measurements

### How to Use in Agent Orchestration

```typescript
// Example: Using Template 1 for documentation task
const prompt = `
${TEMPLATE_1_CONTENT}

[TOPIC] = MCP Code Execution Pattern
[SOURCE] = https://www.anthropic.com/engineering/code-execution-with-mcp
[TARGET_PATH] = docs/03-REFERENCE/REFERENCE_MCP_CODE_EXECUTION.md

Additional context:
- Focus on the file-based tool discovery pattern
- Extract all performance metrics with exact numbers
- If Anthropic doesn't mention specific technologies, say so
`;
```

---

## Anti-Patterns to Avoid

### ❌ Vague Mission Statements
```
"Create a comprehensive guide to X"
→ Agent will fill gaps with training data
```

### ✅ Specific Boundaries
```
"Document only what appears in [SOURCE], mark inferences as [INFERRED]"
→ Agent knows its constraints
```

---

### ❌ Implied Requirements
```
"Analyze performance opportunities"
→ Agent might invent metrics
```

### ✅ Explicit Data Requirements
```
"Measure current performance with [TOOL], document methodology"
→ Agent knows it must measure, not estimate
```

---

### ❌ Trusting First Output
```
Agent returns work → Accept it
→ No verification step
```

### ✅ Two-Agent Verification
```
Agent 1: Does work
Agent 2: Verifies against source/reality
→ Catches extrapolations
```

---

## Template 6: Test Infrastructure Setup with Verification

**Use Case:** Creating E2E test infrastructure, auth setup, or test environments

```markdown
## Mission: Setup [TEST INFRASTRUCTURE]

### Critical Requirements
- ✅ MUST verify the infrastructure actually works by RUNNING tests
- ✅ All configuration must be TESTED, not just created
- ✅ Dependencies must be validated (auth users exist, APIs accessible, etc.)
- ✅ Provide CONCRETE test commands that prove functionality
- ❌ DO NOT report "complete" without running actual tests
- ❌ DO NOT assume configuration works without verification
- ❌ DO NOT skip prerequisite setup steps

### Your Tasks
1. Create infrastructure files:
   - [List specific files]
2. Configure dependencies:
   - [Auth setup, database users, API keys, etc.]
3. **CRITICAL: RUN ACTUAL TESTS**
   - Execute test commands
   - Capture pass/fail results
   - Screenshot or log output
4. Document setup instructions WITH verified commands

### Verification Checklist (MANDATORY)
- [ ] Created all infrastructure files
- [ ] Configured all dependencies
- [ ] **RAN test suite** - Provide actual output
- [ ] Tests PASSED - Show pass rate (X/Y passing)
- [ ] Documented setup steps with verified commands
- [ ] Identified any prerequisites still needed

### Real vs Theoretical Completion

**❌ WRONG (Theoretical):**
```
✅ Created auth helper functions
✅ Configured Playwright projects
✅ Setup ready for use
Status: COMPLETE
```

**✅ RIGHT (Verified):**
```
✅ Created auth helper functions
✅ Configured Playwright projects
⚠️  RAN TESTS: 0/32 passing (auth user doesn't exist)
✅ Documented prerequisite: Create test user first
Status: Infrastructure ready, requires setup steps
```

### Test Execution Report
MUST include:
- **Command run:** `npx playwright test [path]`
- **Result:** X/Y tests passing
- **Failures:** List specific errors with root causes
- **Prerequisites:** What needs to exist before tests run
- **Verification:** Actual terminal output or screenshots

### Common Pitfalls
1. **Creating files ≠ Working system**
   - Files can be perfect but unusable without prerequisites
2. **Configuration ≠ Execution**
   - Config might be correct but tests still fail
3. **"Ready" ≠ "Tested"**
   - Infrastructure is only ready if tests actually pass

### Final Report Structure
```
Infrastructure Created:
- File 1: path/to/file.ts (150 lines)
- File 2: path/to/file.ts (200 lines)

Test Execution Results:
- Command: npx playwright test advanced-features/multi-language
- Result: 5/13 tests passing
- Failures:
  * 8 tests blocked by missing widget iframe
  * Root cause: Widget config incomplete

Prerequisites Identified:
1. Create test user in database
2. Configure widget iframe on test page
3. Enable multi-language support in widget

Next Steps:
1. Run: npx tsx scripts/create-test-user.ts
2. Then run: npx playwright test
3. Expected: 13/13 tests passing

Honest Assessment:
- Infrastructure: 100% complete
- Actual testing done: 38% (5/13 passing)
- Ready for use: NO (requires prerequisites)
```
```

---

## Lesson Learned: E2E Test Infrastructure (Nov 2025)

### What Happened
**Task:** Configure widget test environment, authentication, and E2E tests
**Agent Report:** "✅ Complete - 32 tests ready, infrastructure 100%"
**Reality:** 0 tests actually executable due to missing prerequisites

### The Problem
Agents created perfect infrastructure:
- ✅ 32 E2E test files (well-written)
- ✅ Auth helper functions (194 lines)
- ✅ Playwright configuration (updated)
- ✅ Test user management script (221 lines)

But never verified it worked:
- ❌ Test user doesn't exist in database
- ❌ Auth setup blocks all tests from running
- ❌ Widget iframe not properly configured
- ❌ 0 tests actually executable

### Root Cause
**Agents optimized for creation, not verification:**
1. Created files and reported "complete"
2. Assumed configuration would work
3. Didn't run actual test commands
4. Reported "ready" based on files existing, not tests passing

### The Fix: Template 6
New template mandates:
- **MUST run actual tests** before reporting complete
- **MUST show test results** (X/Y passing)
- **MUST identify prerequisites** needed
- **MUST distinguish** "infrastructure created" from "system working"

### How to Use
```typescript
// ❌ WRONG - Old approach
Task({
  prompt: "Configure E2E test environment",
  // Agent creates files, reports complete, never tests
});

// ✅ RIGHT - New approach with Template 6
Task({
  prompt: `
${TEMPLATE_6_CONTENT}

[TEST INFRASTRUCTURE] = Multi-language E2E tests
[List specific files] = auth-helpers.ts, test-widget page, etc.

CRITICAL: Before reporting complete:
1. Run: npx playwright test advanced-features/multi-language
2. Capture actual output
3. Report pass rate: X/Y tests
4. If 0 tests pass, identify WHY and document prerequisites
5. Status = "Infrastructure ready" + "Prerequisites needed" NOT "Complete"
  `
});
```

### Key Insight
**"Infrastructure created" ≠ "System working"**

Just like you wouldn't report a car as "ready to drive" after assembling parts without starting the engine, don't report test infrastructure as "ready" without running tests.

---

## Continuous Improvement

After each agent task, ask:
1. Did the agent extrapolate beyond its source?
2. Did it add unsupported claims?
3. Could the prompt have been more specific?
4. Should we add a new template for this task type?
5. **Did the agent VERIFY its work by running actual tests/commands?**
6. **Are reported results based on execution or assumption?**

Update this file with new templates as patterns emerge.

---

## Related Documentation

- [CLAUDE.md - Agent Orchestration](../CLAUDE.md#agent-orchestration--parallelization)
- [AGENT_HIERARCHY.md](.claude/AGENT_HIERARCHY.md)
- [Agent Orchestration Best Practices](#) - See CLAUDE.md updates

---

**Last Review:** 2025-11-10
**Next Review:** 2025-12-10 (monthly)
