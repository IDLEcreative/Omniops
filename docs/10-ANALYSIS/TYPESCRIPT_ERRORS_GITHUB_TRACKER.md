# TypeScript Errors - GitHub Issue Tracker

**Last Updated:** 2025-10-31
**Total Errors:** 74
**Status:** 📋 Ready to convert to GitHub issues
**Priority:** MEDIUM (Non-blocking but should be addressed)

---

## Quick Summary

This document tracks 74 TypeScript errors that remain after resolving critical compilation blockers. These errors are organized by category and ready to be converted into GitHub issues for systematic resolution.

**Error Distribution:**
- 🔴 **Critical (TS2304):** 28 errors - Missing imports/undefined names
- 🟡 **High (TS7006/TS7031):** 15 errors - Implicit 'any' parameters
- 🟢 **Medium (Various):** 31 errors - Type safety improvements

**Estimated Total Fix Time:** 60-90 minutes

---

## GitHub Issue Template

Use this template for each issue category:

```markdown
## Issue Title
[TS2304] Fix missing Supabase createClient imports (15 files)

## Description
Multiple files reference `createClient` but the function is not imported, causing TypeScript compilation errors.

## Error Type
- **Error Code:** TS2304
- **Severity:** 🔴 Critical
- **Count:** 15 occurrences

## Affected Files
- lib/adaptive-entity-extractor.ts
- lib/domain-agnostic-agent.ts
- lib/chat-context-enhancer-*.ts
(see full list below)

## Root Cause
The deletion of `types/supabase-new.ts` or missing import statements for Supabase client factory functions.

## Proposed Solution
1. Locate where `createClient` is exported (likely `@supabase/supabase-js` or `lib/supabase-client.ts`)
2. Add import statement to each affected file
3. Verify TypeScript compilation succeeds

## Acceptance Criteria
- [ ] All 15 files import `createClient` correctly
- [ ] TypeScript compilation succeeds for affected files
- [ ] No runtime errors introduced

## Estimated Effort
30-45 minutes

## Labels
- `typescript`
- `bug`
- `high-priority`
```

---

## Issue #1: Missing Supabase `createClient` Imports (15 files)

**Error Code:** TS2304 - Cannot find name 'createClient'
**Severity:** 🔴 Critical
**Priority:** P0 (Must fix first)
**Estimated Time:** 30-45 minutes

### Affected Files

```
lib/adaptive-entity-extractor.ts:38:22
lib/domain-agnostic-agent.ts:31:22
lib/chat-context-enhancer-product-extraction.ts:30:22
lib/chat-context-enhancer-faq-extraction.ts:30:22
lib/chat-context-enhancer-order-extraction.ts:30:22
lib/chat-context-enhancer-multiquery.ts:29:22
lib/chat-context-enhancer-spelling.ts:29:22
lib/chat-context-enhancer-conversational.ts:29:22
lib/chat-context-enhancer-domain-specific.ts:29:22
lib/improved-search-utils.ts:31:22
lib/improved-search-utils.ts:49:24
lib/improved-search-utils.ts:71:24
lib/crawlee-based-crawler.ts:48:22
lib/reindex-embeddings.ts:15:22
app/api/setup-rag-production/route.ts:28:22
```

### Root Cause Analysis

The `createClient` function from `@supabase/supabase-js` is referenced but not imported. This likely happened because:
1. An old import pattern was removed
2. The import statement is missing from file headers
3. The function is being accessed incorrectly

### Recommended Fix

**Step 1:** Verify the correct import:
```bash
grep -r "export.*createClient" node_modules/@supabase/supabase-js/
```

**Step 2:** Add import to all affected files:
```typescript
import { createClient } from '@supabase/supabase-js';
```

**Step 3:** Verify usage pattern:
```typescript
// Correct pattern:
const supabase = createClient(supabaseUrl, supabaseKey);
```

### GitHub Issue Command

```bash
gh issue create \
  --title "[TS2304] Fix missing Supabase createClient imports (15 files)" \
  --body-file docs/10-ANALYSIS/issues/ts2304-createClient.md \
  --label "typescript,bug,high-priority" \
  --assignee @me
```

---

## Issue #2: Missing `supabaseUrl` and `supabaseKey` Variables (3 files)

**Error Code:** TS2304 - Cannot find name
**Severity:** 🔴 Critical
**Priority:** P0
**Estimated Time:** 15 minutes

### Affected Files

```
app/api/setup-rag-production/route.ts:28:40
app/api/setup-rag-production/route.ts:28:54
lib/reindex-embeddings.ts:15:40
```

### Root Cause

These files expect `supabaseUrl` and `supabaseKey` variables but they're not defined in scope.

### Recommended Fix

**Option 1: Use environment variables directly**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
```

**Option 2: Import from config module**
```typescript
import { getSupabaseConfig } from '@/lib/config';
const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();
```

### GitHub Issue Command

```bash
gh issue create \
  --title "[TS2304] Fix missing supabaseUrl/supabaseKey variables (3 files)" \
  --body "Files reference undefined supabaseUrl and supabaseKey variables. Need to add environment variable access or import from config." \
  --label "typescript,bug,high-priority"
```

---

## Issue #3: Missing `createServerClient` Import (1 file)

**Error Code:** TS2304 - Cannot find name 'createServerClient'
**Severity:** 🔴 Critical
**Priority:** P0
**Estimated Time:** 5 minutes

### Affected Files

```
app/auth/callback/route.ts:13:22
```

### Recommended Fix

```typescript
import { createServerClient } from '@supabase/ssr';
```

### GitHub Issue Command

```bash
gh issue create \
  --title "[TS2304] Fix missing createServerClient import in auth callback" \
  --body "Auth callback route is missing import for createServerClient from @supabase/ssr" \
  --label "typescript,bug,auth,high-priority"
```

---

## Issue #4: Missing `iterationConfig` Variable (3 files)

**Error Code:** TS2304 - Cannot find name 'iterationConfig'
**Severity:** 🔴 Critical
**Priority:** P1
**Estimated Time:** 10 minutes

### Affected Files

```
lib/chat/ai-processor.ts:68:48
lib/chat/ai-processor.ts:71:26
lib/chat/ai-processor.ts:72:30
```

### Root Cause

The `iterationConfig` variable is referenced but not defined in the current scope. This might be:
1. A parameter that should be passed in
2. A constant that should be imported
3. A variable that should be defined locally

### Recommended Fix

**Investigate first:**
```bash
git log --all --full-history -S "iterationConfig" -- lib/chat/ai-processor.ts
```

**Then either:**
```typescript
// Option 1: Define locally
const iterationConfig = {
  maxIterations: 5,
  // ... other config
};

// Option 2: Import from config
import { iterationConfig } from '@/lib/chat/config';
```

### GitHub Issue Command

```bash
gh issue create \
  --title "[TS2304] Fix missing iterationConfig in AI processor" \
  --body "AI processor references undefined iterationConfig variable. Need to investigate git history and restore proper definition." \
  --label "typescript,bug,ai,high-priority"
```

---

## Issue #5: Implicit 'any' Parameters (15 files)

**Error Code:** TS7006, TS7031 - Parameter implicitly has 'any' type
**Severity:** 🟡 High
**Priority:** P2
**Estimated Time:** 15-20 minutes

### Affected Files

```
lib/redis-utils.ts:15:26
lib/redis-utils.ts:20:52
lib/scraper-config.ts:89:31
lib/chat/tool-handlers.ts:45:38
lib/queue/job-processor.ts:127:27
(and 10 more...)
```

### Recommended Fix

Add explicit type annotations:

```typescript
// Before:
function processItem(item) { ... }

// After:
function processItem(item: ProcessedItem) { ... }

// Or if truly dynamic:
function processItem(item: unknown) {
  // Add type guards
  if (typeof item === 'object' && item !== null) {
    // Safe to use item
  }
}
```

### GitHub Issue Command

```bash
gh issue create \
  --title "[TS7006] Add explicit types to function parameters (15 occurrences)" \
  --body "Multiple functions have implicit 'any' parameter types. Need to add explicit type annotations for better type safety." \
  --label "typescript,code-quality,medium-priority"
```

---

## Issue #6: Null/Undefined Handling (22 files)

**Error Codes:** TS18047, TS18048, TS2532 - Object possibly null/undefined
**Severity:** 🟢 Medium
**Priority:** P3
**Estimated Time:** 20-30 minutes

### Example Errors

```
lib/link-sanitizer.ts:45:15 - TS18047: 'domain' is possibly 'null'
lib/chat/ai-processor.ts:92:7 - TS18048: 'telemetry' is possibly 'undefined'
lib/embeddings.ts:156:12 - TS2532: Object is possibly 'undefined'
```

### Recommended Fix

Use optional chaining and nullish coalescing:

```typescript
// Before:
const value = obj.property.subProperty;

// After:
const value = obj?.property?.subProperty ?? defaultValue;

// Or with type guard:
if (obj && obj.property) {
  const value = obj.property.subProperty;
}
```

### GitHub Issue Command

```bash
gh issue create \
  --title "[TS18047/TS18048] Add null/undefined guards (22 occurrences)" \
  --body "Multiple locations need null/undefined checks. Add optional chaining and type guards for safer runtime behavior." \
  --label "typescript,code-quality,medium-priority"
```

---

## Issue #7: Type Compatibility Issues (10 files)

**Error Codes:** TS2322, TS2339, TS2345 - Type mismatches
**Severity:** 🟢 Medium
**Priority:** P3
**Estimated Time:** 15-20 minutes

### Common Patterns

```
TS2322: Type 'X' is not assignable to type 'Y'
TS2339: Property 'foo' does not exist on type 'Bar'
TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

### Recommended Approach

1. Review each error individually
2. Determine if:
   - Type definition is wrong (fix the type)
   - Usage is wrong (fix the code)
   - Type assertion is needed (use sparingly)

### GitHub Issue Command

```bash
gh issue create \
  --title "[TS2322/TS2339] Fix type compatibility issues (10 files)" \
  --body "Various type mismatches and missing properties. Requires individual review of each error." \
  --label "typescript,code-quality,medium-priority"
```

---

## Issue #8: Questionable Type Conversions (4 files)

**Error Code:** TS2352 - Conversion may be a mistake
**Severity:** 🟢 Medium
**Priority:** P4
**Estimated Time:** 10 minutes

### Recommended Fix

Review each type conversion and either:
1. Fix the underlying types to make conversion unnecessary
2. Add intermediate type assertion if conversion is intentional
3. Refactor to avoid the conversion

```typescript
// If conversion is truly needed:
const value = unknownValue as unknown as TargetType;
```

### GitHub Issue Command

```bash
gh issue create \
  --title "[TS2352] Review questionable type conversions (4 occurrences)" \
  --body "TypeScript warns about potentially incorrect type conversions. Review and fix or justify each conversion." \
  --label "typescript,code-quality,low-priority"
```

---

## Priority Matrix

| Priority | Category | Issues | Estimated Time | Impact |
|----------|----------|--------|----------------|--------|
| **P0** | TS2304 (Critical imports) | 3 issues | 50-60 min | Blocks functionality |
| **P1** | TS2304 (Other missing names) | 1 issue | 10 min | May cause runtime errors |
| **P2** | TS7006/TS7031 (Implicit any) | 1 issue | 15-20 min | Reduces type safety |
| **P3** | TS18047/18048/2322/2339 | 3 issues | 45-60 min | Runtime safety |
| **P4** | TS2352 (Conversions) | 1 issue | 10 min | Code quality |

**Total Estimated Time:** 130-160 minutes (2-3 hours)

---

## Bulk Issue Creation Script

Create all issues at once with this script:

```bash
#!/bin/bash
# create-typescript-issues.sh

echo "Creating GitHub issues for TypeScript errors..."

# Issue #1: createClient imports
gh issue create \
  --title "[TS2304] Fix missing Supabase createClient imports (15 files)" \
  --body "$(cat <<'EOF'
## Problem
Multiple files reference `createClient` but the function is not imported from @supabase/supabase-js.

## Affected Files (15 total)
- lib/adaptive-entity-extractor.ts
- lib/domain-agnostic-agent.ts
- lib/chat-context-enhancer-*.ts (7 files)
- lib/improved-search-utils.ts (3 occurrences)
- lib/crawlee-based-crawler.ts
- lib/reindex-embeddings.ts
- app/api/setup-rag-production/route.ts

## Solution
Add import: `import { createClient } from '@supabase/supabase-js';`

## Acceptance Criteria
- [ ] All 15 files have correct import
- [ ] TypeScript compiles without TS2304 errors
- [ ] No runtime errors

## Estimated Time: 30-45 minutes
EOF
)" \
  --label "typescript,bug,high-priority" \
  --milestone "Code Quality Sprint"

# Issue #2: supabaseUrl/supabaseKey
gh issue create \
  --title "[TS2304] Fix missing supabaseUrl/supabaseKey variables (3 files)" \
  --body "Files reference undefined supabaseUrl and supabaseKey variables. Need to add environment variable access or import from config module." \
  --label "typescript,bug,high-priority"

# Issue #3: createServerClient
gh issue create \
  --title "[TS2304] Fix missing createServerClient import in auth callback" \
  --body "Auth callback route missing: \`import { createServerClient } from '@supabase/ssr';\`" \
  --label "typescript,bug,auth,high-priority"

# Issue #4: iterationConfig
gh issue create \
  --title "[TS2304] Fix missing iterationConfig in AI processor" \
  --body "AI processor references undefined iterationConfig. Investigate git history and restore proper definition." \
  --label "typescript,bug,ai,high-priority"

# Issue #5: Implicit any
gh issue create \
  --title "[TS7006] Add explicit types to function parameters (15 occurrences)" \
  --body "Add explicit type annotations to 15 function parameters currently implicitly typed as 'any'." \
  --label "typescript,code-quality,medium-priority"

# Issue #6: Null handling
gh issue create \
  --title "[TS18047/TS18048] Add null/undefined guards (22 occurrences)" \
  --body "Add optional chaining (?.) and nullish coalescing (??) to handle potentially null/undefined values safely." \
  --label "typescript,code-quality,medium-priority"

# Issue #7: Type compatibility
gh issue create \
  --title "[TS2322/TS2339] Fix type compatibility issues (10 files)" \
  --body "Resolve type mismatches, missing properties, and incompatible assignments. Requires individual review." \
  --label "typescript,code-quality,medium-priority"

# Issue #8: Type conversions
gh issue create \
  --title "[TS2352] Review questionable type conversions (4 occurrences)" \
  --body "Review and justify or fix type conversions flagged as potentially incorrect." \
  --label "typescript,code-quality,low-priority"

echo "✅ Created 8 GitHub issues for TypeScript errors"
echo "View all issues: gh issue list --label typescript"
```

**Usage:**
```bash
chmod +x create-typescript-issues.sh
./create-typescript-issues.sh
```

---

## Progress Tracking

### Phase 1: Critical Imports (P0) - Week 1
- [ ] Issue #1: createClient imports (15 files)
- [ ] Issue #2: supabaseUrl/supabaseKey (3 files)
- [ ] Issue #3: createServerClient (1 file)

### Phase 2: Missing Definitions (P1) - Week 1
- [ ] Issue #4: iterationConfig (3 occurrences)

### Phase 3: Type Safety (P2) - Week 2
- [ ] Issue #5: Implicit 'any' parameters (15 occurrences)

### Phase 4: Null Handling (P3) - Week 2
- [ ] Issue #6: Null/undefined guards (22 occurrences)
- [ ] Issue #7: Type compatibility (10 files)

### Phase 5: Code Quality (P4) - Week 3
- [ ] Issue #8: Type conversions (4 occurrences)

---

## Success Metrics

**Goal:** Reduce TypeScript errors from 74 to 0

**Milestones:**
- Week 1: Resolve P0-P1 issues (28 errors) → **46 remaining**
- Week 2: Resolve P2-P3 issues (36 errors) → **10 remaining**
- Week 3: Resolve P4 issues (10 errors) → **0 remaining** ✅

**Verification:**
```bash
# After each phase
npx tsc --noEmit | grep "error TS" | wc -l
```

---

## Additional Resources

- **TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook/
- **TS Error Reference:** https://typescript.tv/errors/
- **Project tsconfig.json:** `/Users/jamesguy/Omniops/tsconfig.json`
- **Full Error Log:** Run `npx tsc --noEmit > typescript-errors.log`

---

**Document Maintained By:** Development Team
**Last Audit:** 2025-10-31
**Next Review:** After each completed issue
