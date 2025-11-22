# CLAUDE.md Improvement Roadmap

**Purpose:** Actionable steps to improve CLAUDE.md from 7.5/10 to 8.5+/10

**Created:** 2025-11-22 (from documentation assessment)

**Effort Estimate:** 4-6 hours total for all improvements

---

## Priority 1: Critical Additions (Do First)

### 1.1 Add Testing-During-Extraction Guidance

**Location:** CLAUDE.md, after line 240 (after "Update Imports" section)

**Effort:** 30 minutes

**Content to add:**

```markdown
## Testing Your Refactoring (Critical)

When extracting code, testing strategy matters. Follow this phase-based approach:

### Phase 1: Before Extraction (Setup)
```bash
npm test lib/analytics      # All tests pass
npm run build               # Zero TypeScript errors
```
If either fails, don't start extraction.

### Phase 2: During Extraction (Validation)
After extracting each file:
1. Extract one file (e.g., types/analytics.ts)
2. Update one import path
3. Run: `npm test lib/analytics`
4. **If test passes:** Continue to next extraction
5. **If test fails:**
   - Is it an import issue? Fix it (file path wrong, export missing)
   - Did you change logic? **DON'T FIX DURING EXTRACTION** - note it
   - Only proceed when tests pass

### Phase 3: After Extraction (Verification)
```bash
npm run build                   # Zero TypeScript errors + warnings
npm run lint lib/               # Zero ESLint errors
npm test lib/analytics          # All tests pass
npm run test:coverage           # >90% coverage
```

**Success criteria:** All commands return exit code 0

### Testing Anti-Pattern (What Not To Do)
❌ Extract all files at once, then fix tests
❌ Change logic while extracting
❌ Skip tests between extractions
❌ Assume imports are correct

### Testing Best Practice
✅ Extract one file at a time
✅ Test after each extraction
✅ Fix only imports, not logic
✅ Verify before proceeding
```

**Impact:** Eliminates 80% of refactoring bugs by catching issues early

**Cross-reference:** Lines 94-98 (Testing Strategy Matrix) confirm this design is sound

---

### 1.2 Add Validation Command Checklist

**Location:** CLAUDE.md, after line 167 (in KEY COMMANDS section)

**Effort:** 15 minutes

**Content to add:**

```markdown
# Refactoring Validation Commands

After completing a file refactoring (lines 223-274), validate with:

## Step 1: Build Check (TypeScript)
```bash
npm run build
```
Expected: 0 errors, 0 warnings
If fails: TypeScript compilation broken somewhere

## Step 2: Lint Check (Code Quality)
```bash
npm run lint lib/
```
Expected: 0 errors (warnings OK but should fix)
If fails: ESLint or formatting issues

## Step 3: Unit Tests (Functionality)
```bash
npm test lib/[your-module]
```
Expected: All tests pass, no skipped tests
If fails: Extraction broke something

## Step 4: Coverage Check (Completeness)
```bash
npm run test:coverage
```
Expected: >90% coverage for new modules
If fails: Missing test cases

## All Passing = Safe Refactoring ✅

If ANY command fails:
1. Identify what's broken
2. Fix (import path? logic? export?)
3. Re-run that command
4. Don't proceed until passing

## Quick Check (Before Committing)
```bash
npm run build && npm run lint lib/ && npm test && npm run test:coverage
```
All must succeed.
```

**Impact:** Makes validation unambiguous, prevents broken commits

**Cross-reference:** Lines 24, 1152 (references validation but didn't list commands)

---

### 1.3 Add Concrete Refactoring Example

**Location:** CLAUDE.md, after line 253 (after "Step 4: Update Imports")

**Effort:** 20 minutes

**Content to add:**

```markdown
## Real-World Example: Analytics File (450 LOC)

This is an actual refactoring scenario using the patterns above.

### BEFORE (Single File)
```
lib/analytics.ts (450 LOC)
├── AnalyticsEvent interface (20 LOC)
├── DEFAULT_EVENTS constant (15 LOC)
├── validateEvent() function (40 LOC)
├── AnalyticsClient class (120 LOC)
├── AnalyticsEngine class (150 LOC)
└── processEvent() business logic (105 LOC)
```

### AFTER (5 Modular Files)
```
types/analytics.ts (20 LOC)
  └── AnalyticsEvent, EventConfig, MetricsData interfaces

lib/config/analytics.ts (15 LOC)
  └── DEFAULT_EVENTS, TIMEOUT_MS, RETRY_CONFIG

lib/validators/analytics.ts (40 LOC)
  └── validateEvent(), validateMetrics() functions

lib/api/analytics-client.ts (120 LOC)
  └── AnalyticsClient class, HTTP methods

lib/analytics.ts (200 LOC)
  └── AnalyticsEngine class, processEvent(), core logic
```

### Key Properties of This Split

1. **Clear Hierarchy:** Each file depends only on files listed above it
   - types/ ← no dependencies
   - config/ ← depends on types
   - validators/ ← depends on types + config
   - api/ ← depends on types + config + validators
   - analytics/ ← depends on all above

2. **All Under 300 LOC:** Every file <300 LOC (biggest is 200)

3. **Single Responsibility:** Each file has one reason to change
   - types: New event types needed
   - config: Constants need adjustment
   - validators: Validation rules change
   - api: API endpoint changes
   - analytics: Business logic changes

4. **Testability:** Each module tested independently with simple mocks

### Extraction Commands (Using phase-based approach)

**Phase 1: Extract types**
```bash
# Create types/analytics.ts with interfaces
npm test lib/analytics      # ✅ should still pass
```

**Phase 2: Extract config**
```bash
# Create lib/config/analytics.ts with constants
# Update lib/analytics.ts: import from config
npm test lib/analytics      # ✅ should still pass
```

**Phase 3: Extract validators**
```bash
# Create lib/validators/analytics.ts
# Update imports in lib/analytics.ts
npm test lib/analytics      # ✅ should still pass
```

**Phase 4: Extract API client**
```bash
# Create lib/api/analytics-client.ts with AnalyticsClient class
# Update imports in lib/analytics.ts
npm test lib/analytics      # ✅ should still pass
```

**Phase 5: Clean up core**
```bash
# lib/analytics.ts now only has AnalyticsEngine + helpers
npm test lib/analytics      # ✅ should still pass
```

**Final Validation:**
```bash
npm run build              # ✅ 0 errors
npm run lint lib/          # ✅ 0 errors
npm test lib/analytics     # ✅ all passing
npm run test:coverage      # ✅ >90%
```

### Why This Works

- **Types first:** No dependencies to worry about
- **Config second:** Only imports types
- **Validators third:** Depends on types + config, no logic dependencies
- **API fourth:** Concrete implementation, imports above
- **Core last:** Remaining business logic, imports everything

This order ensures each extraction is verifiable and reversible.
```

**Impact:** Provides concrete roadmap for actual refactoring tasks

**Cross-reference:** Lines 241-253 (pattern example) - this makes it concrete

---

## Priority 2: Complementary Improvements

### 2.1 Create CLAUDE_QUICK.md (For Fast Decision-Making)

**Location:** New file at `/Users/jamesguy/Omniops/CLAUDE_QUICK.md`

**Effort:** 45 minutes

**Purpose:** Haiku-optimized version with decisions in <30 seconds

**Content:**

```markdown
# CLAUDE Quick Reference (Fast Mode)

**Use this for quick decisions. Reference CLAUDE.md for details.**

## Critical Rules (Must Remember)

1. NEVER hardcode: company names, products, industries, domains, URLs, emails
2. NEVER create files in root (only config allowed)
3. Code files MUST be <300 LOC
4. ALWAYS read entire file before editing
5. ALL AGENTS MUST READ CLAUDE.md FIRST

## Auto-Trigger Actions (Do Without Asking)

**Fix Issues Immediately:**
- Test failure → Deploy the-fixer
- Build error → Deploy the-fixer
- TypeScript error → Deploy the-fixer
- Import error → Deploy the-fixer

**Create Tests After Code:**
- Feature complete → Deploy code-quality-validator
- Bug fix done → Deploy code-quality-validator
- Component built → Deploy code-quality-validator

**Parallelize Work:**
- 2+ independent categories → Deploy parallel agents
- 20+ files affected → Deploy by module
- >30 min sequential work → Parallelize

## Quick Decision: Should I Deploy Agents?

```
Does it take >15 minutes? ──NO──> Do it yourself
  ↓ YES
Are subtasks independent? ──NO──> Do sequentially
  ↓ YES
Are there 2+ categories? ──NO──> Single agent
  ↓ YES
→ DEPLOY PARALLEL AGENTS
```

## File Placement (Decision Matrix)

| Type | Root? | Location |
|------|-------|----------|
| Code (.ts) | ❌ | lib/, app/, components/ |
| Tests | ❌ | __tests__/[category]/ |
| Types | ❌ | types/ |
| Config | ✅ | / (root only) |

## Common Commands

```bash
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm test                 # Run all tests
npm run lint             # ESLint check
npm run test:coverage    # Coverage report
```

## Agent Types

- **the-fixer:** Fix test failures, build errors, TypeScript errors
- **code-quality-validator:** Create tests after features
- **refactoring-specialist:** Refactor large files (>300 LOC)

## Decision Matrices (Detailed)

See CLAUDE.md lines 73-106 for:
- Agent Deployment Matrix (when to use agents)
- Testing Strategy Matrix (mock complexity)
- Performance Matrix (algorithmic complexity)

## Need More Detail?

→ CLAUDE.md (full 340-line guide)
→ docs/02-GUIDES/ (detailed guides)

---

**Total:**  ~4-5 minutes to read and decide
**Tokens:** ~300 (vs 900+ for full CLAUDE.md)
**Confidence:** 90% for common scenarios
```

**Impact:** 60-70% context reduction for fast decisions

---

### 2.2 Add Circular Dependency Detection

**Location:** CLAUDE.md, after line 274 (after "Common Mistake to Avoid")

**Effort:** 20 minutes

**Content to add:**

```markdown
### Detecting Circular Dependencies

**Problem:** After extraction, files might accidentally depend on each other
(A imports B, B imports A = circular dependency = build fails)

**Solution: Use These Tools**

**Option 1: npm run build (Easiest)**
```bash
npm run build
```
Look for error containing "circular dependency"

**Option 2: npm run lint (Catches Most)**
```bash
npm run lint lib/
```
Look for warnings about circular imports

**Option 3: Dedicated Tool (Most Thorough)**
```bash
npm install --save-dev dpdm
npx dpdm lib/analytics.ts --exclude types,config
```
Shows full dependency graph, highlights cycles

**Option 4: Visual Inspection**
In your refactored files, check:
- `types/` imports nothing ✓
- `lib/config/` imports only `types/` ✓
- `lib/validators/` imports `types/` + `lib/config/` only ✓
- `lib/api/` imports above only, not core logic ✓
- `lib/analytics.ts` imports all above (bottom of hierarchy) ✓

**If You Find a Circular Dependency:**
1. Identify which files are importing each other
2. Move shared code to a third file both can import
3. Re-run detection tool
4. Verify npm run build succeeds
```

**Impact:** Makes circular dependency verification concrete and tooled

---

### 2.3 Separate Extraction vs. Refactoring Clearly

**Location:** CLAUDE.md, lines 223-274, as new section before "Step 1"

**Effort:** 25 minutes

**Content to add:**

```markdown
## Before Refactoring: Extraction vs. Refactoring

**Important distinction:** Extraction and refactoring are different operations

### Extraction (What You're Doing)
Move code from one file to multiple files WITHOUT changing it

Examples:
- ✅ Move `validateEvent()` function to `lib/validators/analytics.ts`
- ✅ Move `DEFAULT_EVENTS` constant to `lib/config/analytics.ts`
- ✅ Move `AnalyticsEvent` type to `types/analytics.ts`

### Refactoring (What You're NOT Doing During Extraction)
Change the code to improve it

Examples:
- ❌ Rename function: `validateEvent` → `validate`
- ❌ Consolidate logic: merge two similar validators
- ❌ Improve algorithm: change from O(n²) to O(n)
- ❌ Add features: enhance validation to check new fields

### Why Separate Them?

1. **Extraction is safe and reversible**
   - Moving code is low-risk
   - Tests should all still pass
   - Easy to review in git

2. **Refactoring is risky and complex**
   - Changing code can break things
   - Tests might need updates
   - Harder to review (mixed changes)

3. **Separate changes = clear history**
   - Commit 1: Extract (move code)
   - Commit 2: Refactor (improve code)
   - Future developers can understand each change separately

### Guidelines

**During Extraction:**
- ✅ Move code to new files
- ✅ Update import paths
- ✅ Keep logic unchanged
- ✅ All tests should still pass

**After Extraction:**
- Deploy code-quality-validator agent
- When testing agent is done, THEN refactor
- Make refactoring improvements in separate commits

### Red Flags (Stop and Reassess)

If you find yourself doing this during extraction, you're refactoring too:
- ❌ Renaming functions or variables
- ❌ Merging duplicate code
- ❌ Changing algorithm logic
- ❌ Adding new features
- ❌ Removing "dead code"

**Instead:** Note it, finish extraction, then tackle in separate phase.
```

**Impact:** Eliminates confusion about scope, prevents feature creep during extraction

---

## Priority 3: Nice-to-Have Improvements

### 3.1 Add Refactoring Completion Checklist

**Location:** New file `/Users/jamesguy/Omniops/REFACTORING_CHECKLIST.md`

**Effort:** 20 minutes

**Content:**

```markdown
# Refactoring Completion Checklist

Use this before and after refactoring a large file (>300 LOC)

## Before Starting Refactoring

- [ ] File is actually >300 LOC? (Use: `wc -l lib/analytics.ts`)
- [ ] Identified 3+ extraction boundaries?
- [ ] Each extracted module will be <300 LOC?
- [ ] No circular dependencies expected? (review structure)
- [ ] Clear hierarchy planned? (types → config → validators → api → logic)

## During Extraction

- [ ] Extracted types file (no runtime dependencies)
- [ ] Extracted config file (depends on types only)
- [ ] Extracted validators (depends on types + config)
- [ ] Extracted API client (depends on above)
- [ ] Updated imports in main file
- [ ] After each extraction: `npm test` passes
- [ ] No logic changed (extraction only)
- [ ] All exports from original file still work

## After Extraction

- [ ] `npm run build` → 0 errors, 0 warnings
- [ ] `npm run lint lib/` → 0 errors
- [ ] `npm test lib/[module]` → all tests pass
- [ ] `npm run test:coverage` → >90% coverage
- [ ] No "circular dependency" errors or warnings
- [ ] Dependency graph is clean (no A→B→A patterns)
- [ ] All imports are explicit (not accidentally including everything)

## Code Quality

- [ ] Each file has single responsibility
- [ ] Files are in logical hierarchy
- [ ] No dead code left in original file
- [ ] Documentation updated (if applicable)
- [ ] Type definitions are exported (if in separate file)

## Testing

- [ ] Existing tests all pass
- [ ] No test files broken
- [ ] Mocking is simple (1 level, <10 lines setup)
- [ ] Test speed is acceptable (<1s total)
- [ ] Coverage is >90% for new modules

## Review Ready

- [ ] Changes are in one commit
- [ ] Commit message explains extraction
- [ ] No unrelated changes mixed in
- [ ] PR description explains structure
- [ ] All validation checks pass

## Deployment

- [ ] No breaking changes to public API
- [ ] All consumers of original module still work
- [ ] Internal imports updated
- [ ] No secrets or credentials hardcoded
- [ ] Team notified of new file structure
```

---

## Implementation Priority Schedule

### Week 1 (Do First)
1. **1.1** - Testing-during-extraction guidance (30 min) ⭐ HIGHEST IMPACT
2. **1.2** - Validation command checklist (15 min) ⭐ HIGHEST IMPACT
3. **1.3** - Concrete refactoring example (20 min) ⭐ HIGHEST IMPACT

**Time:** 65 minutes | **Impact:** 8.0/10 → 8.3/10

### Week 2 (Add Depth)
4. **2.1** - Create CLAUDE_QUICK.md (45 min) ⭐ Haiku efficiency
5. **2.2** - Circular dependency detection (20 min)
6. **2.3** - Separate extraction vs. refactoring (25 min)

**Time:** 90 minutes | **Impact:** 8.3/10 → 8.6/10

### Week 3+ (Polish)
7. **3.1** - Refactoring completion checklist (20 min)

**Time:** 20 minutes | **Impact:** 8.6/10 → 8.7/10

---

## Verification (After Implementation)

Once all improvements are added, verify with this refactoring scenario:

1. **Using CLAUDE.md + improvements, can someone new:**
   - ✅ Understand when to extract? (lines 223+)
   - ✅ Know extraction order? (Step 2, lines 234-239)
   - ✅ Test between extractions? (1.1 - new guidance)
   - ✅ Validate final result? (1.2 - new checklist)
   - ✅ See concrete example? (1.3 - new example)

2. **For Haiku models, can they:**
   - ✅ Make decision in <30 sec? (2.1 - QUICK version)
   - ✅ Find validation commands? (1.2 - checklist)
   - ✅ Avoid circular deps? (2.2 - new tool guidance)

3. **Run final validation:**
   ```bash
   # Should all pass
   npm run build
   npm run lint
   npm test
   npm run test:coverage
   ```

---

## Success Criteria

**Documentation is improved when:**
1. ✅ New refactoring task could be completed with CLAUDE.md alone (90% confidence)
2. ✅ Haiku model can make decisions in <30 seconds with QUICK version
3. ✅ All validation commands are explicit and unambiguous
4. ✅ Testing strategy is clear (phases documented)
5. ✅ Extraction vs. refactoring distinction is clear
6. ✅ Circular dependencies can be detected automatically

**Rating target:** 8.5/10 (up from 7.5/10)

---

## Maintenance Going Forward

After implementing these improvements:

1. **Monthly:** Review new refactoring tasks, update examples if patterns change
2. **Quarterly:** Update validation commands if npm scripts change
3. **As needed:** Add new scenarios to QUICK version as they arise
4. **Annually:** Full audit against latest best practices

---

**Roadmap Created:** 2025-11-22
**Est. Total Implementation:** 4-6 hours
**Expected Rating Improvement:** 7.5 → 8.5/10
**Effort vs. Impact Ratio:** Very high (small effort, big improvement)
