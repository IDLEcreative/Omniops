# Refactoring Demonstration Plan

**Type:** Implementation Plan
**Status:** Active
**Purpose:** Demonstrate refactoring-specialist skill working on real code, then resume skills framework creation
**Estimated Time:** 30 minutes total

---

## Objective

Demonstrate the refactoring-specialist skill working in practice by extracting **just the error handler** from app/api/chat/route.ts (Phase 1 of the agent's plan). This proves the concept works, then we continue building the skills framework.

---

## Why Phase 1 Only (Error Handler)

**Reasoning:**
- ✅ **Self-contained** - No dependencies on other modules
- ✅ **Low risk** - Pure extraction, no logic changes
- ✅ **High impact** - Removes ~120 lines from route.ts
- ✅ **Fast** - 15-20 minutes including validation
- ✅ **Proves concept** - Validates skill works on real code

**What we're NOT doing (save for later):**
- ❌ Middleware extraction (Phases 2-3)
- ❌ Handler extraction (Phases 4-5)
- ❌ Full route.ts refactoring (Phase 6)

**Reason:** Priority is building skills framework, not refactoring the entire codebase.

---

## Implementation Plan

### Step 1: Create Error Handler Module (10 minutes)

**File:** `lib/chat/errors/chat-error-handler.ts`

**Extracts from route.ts:**
- Lines 36-84: `extractOpenAIError` function (~48 LOC)
- Lines 313-393: Error handling catch block (~80 LOC)

**New module structure:**
```typescript
// lib/chat/errors/chat-error-handler.ts (~110 LOC)

export function extractOpenAIError(error: unknown): OpenAIErrorDetails | null {
  // Existing implementation (lines 44-84 from route.ts)
}

export class ChatErrorHandler {
  constructor(private deps: { telemetry?: ChatTelemetry }) {}

  async handleError(error: unknown, context: ErrorContext): Promise<NextResponse> {
    // Error handling logic from catch block (lines 313-393)
  }
}
```

**Changes to route.ts:**
- Remove lines 36-84 (extractOpenAIError)
- Replace lines 313-393 with:
  ```typescript
  catch (error) {
    return await errorHandler.handleError(error, { /* context */ });
  }
  ```
- Add import: `import { ChatErrorHandler } from '@/lib/chat/errors/chat-error-handler';`

**Expected Result:**
- route.ts: 394 → ~280 LOC (114 lines removed)
- New file: chat-error-handler.ts (~110 LOC)
- Net: +4 LOC (proper separation)

---

### Step 2: Validate Changes (5 minutes)

**Run validation scripts:**
```bash
# 1. Check LOC limits
./scripts/validation/analyze-file-complexity.sh app/api/chat/route.ts

# 2. TypeScript compilation
npx tsc --noEmit

# 3. Linting
npm run lint

# 4. Related tests
npm test -- --findRelatedTests app/api/chat/route.ts lib/chat/errors/chat-error-handler.ts
```

**Success Criteria:**
- [ ] TypeScript compiles (no errors)
- [ ] Linting passes
- [ ] Tests pass (no behavior changes)
- [ ] route.ts is now <300 LOC

---

### Step 3: Measure Impact (5 minutes)

**Metrics to capture:**

**Context Savings:**
- Without skill: [Would have done extraction manually, reading file multiple times]
- With skill: [Agent designed the extraction, I just implement]
- Estimated savings: ~50% context (agent did the analysis)

**Time Savings:**
- Manual approach: ~45 minutes (analyze, design, implement, test)
- With skill: ~20 minutes (implement from agent's plan, test)
- Savings: ~25 minutes (56% reduction)

**Code Quality:**
- LOC reduction: 394 → ~280 (29% reduction in route.ts)
- Testability: Error handling now isolated and testable
- Maintainability: Clear separation of concerns

---

### Step 4: Document Results (5 minutes)

**Create completion report:**
- What was refactored
- Validation results
- Measured savings
- Lessons learned
- Next steps (continue with skills framework)

---

### Step 5: Resume Skills Framework (5 minutes)

**Next priority: Create docs-standards-validator skill**

**Why:** High impact skill that will be used frequently for documentation quality

**After demonstration:**
- Refactoring-specialist skill is proven to work ✅
- Can refactor other files later when time permits
- Focus returns to building complete skills library

---

## Timeline

| Task | Time | Cumulative |
|------|------|------------|
| Create error handler module | 10 min | 10 min |
| Update route.ts imports/catch | 3 min | 13 min |
| Run validation scripts | 5 min | 18 min |
| Measure and document impact | 7 min | 25 min |
| Create completion report | 5 min | 30 min |
| **Total** | **30 min** | |

---

## Success Criteria

**Demonstration is successful if:**
- [x] Error handler extracted to dedicated module
- [x] route.ts reduced by ~100+ lines
- [x] All tests pass unchanged
- [x] TypeScript compiles
- [x] Linting passes
- [x] Metrics captured (context/time savings)
- [x] Results documented

**Then we:**
- [x] Resume building skills framework
- [x] Create docs-standards-validator skill next
- [x] Continue with optimization-reviewer
- [x] Complete skills library

---

## What This Proves

**Validation of Skills Framework:**
- ✅ Refactoring-specialist skill works on real code
- ✅ Agent analysis provides actionable implementation plan
- ✅ Context protection pattern delivers actual savings
- ✅ Validation scripts catch issues early
- ✅ SOLID principles improve code quality

**Foundation for Future:**
- Can refactor other files using same pattern
- Have proven approach for code quality improvements
- Skills library is valuable and effective

---

## After Demonstration

**Resume Skills Framework Creation:**

**Immediate Next (This Week):**
1. Create `docs-standards-validator` skill
2. Create `optimization-reviewer` skill
3. Create `brand-agnostic-checker` skill
4. Update CLAUDE.md with skill references
5. Create final skills framework completion report

**Later (As Needed):**
6. Use refactoring-specialist on other files (search-cache, embeddings-enhanced)
7. Use file-placement-enforcer for all new files
8. Use docs-standards-validator for documentation
9. Build additional skills as patterns emerge

---

## Risk Assessment

**Risks:**
- 🟢 **Low:** Error handler is self-contained
- 🟢 **Low:** No behavior changes, just extraction
- 🟢 **Low:** Easy to rollback if issues

**Mitigation:**
- Keep git history clean (atomic commits)
- Run full test suite before committing
- Document changes clearly

---

## Rollback Plan

**If anything goes wrong:**
```bash
git checkout app/api/chat/route.ts
rm lib/chat/errors/chat-error-handler.ts
git restore .
```

**Trigger for rollback:**
- Tests fail after extraction
- TypeScript errors introduced
- Linting fails
- Unexpected behavior changes

---

## Conclusion

This focused demonstration will:
1. **Prove** the refactoring-specialist skill works in practice
2. **Deliver** immediate improvement (29% LOC reduction in route.ts)
3. **Measure** actual context and time savings
4. **Validate** the entire skills framework approach
5. **Enable** continuation of skills library creation

**Time Investment:** 30 minutes
**Value:** Proof of concept + improved codebase + foundation for future

Then we return to the core priority: **building the complete skills framework.**

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
