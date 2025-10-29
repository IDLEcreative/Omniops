# Documentation Reference Fix Checklist

**Priority-ordered action items to fix broken documentation references**

Generated: 2025-10-24
Based on: `DOC_REFERENCE_VALIDATION_REPORT.md`

## Status: ✅ Actually Better Than Expected!

After verification, many "missing" files actually **DO exist**, they just need path corrections in the documentation.

---

## ✅ CONFIRMED: Files That Exist But Have Wrong Paths

### 1. Provider Files ✅
**Issue:** Referenced as `./providers/woocommerce-provider`
**Reality:** Located at `lib/agents/providers/woocommerce-provider.ts`
**Fix:** Update all references to use correct path

**Files to Fix:**
- `CHANGELOG.md` (line 68)
- `PULL_REQUEST_TEMPLATE.md` (line 24)
- `docs/.metadata/version-matrix.md` (line 324)
- `docs/COMMERCE_PROVIDER_TEST_ANALYSIS.md` (line 11)

**Find & Replace:**
```bash
# Find all occurrences
grep -r "./providers/woocommerce-provider" --include="*.md" .

# Should be:
lib/agents/providers/woocommerce-provider
```

### 2. Database Schema ✅
**Issue:** Referenced as `07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md`
**Reality:** Located at `docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md`
**Fix:** Add `docs/` prefix to all references

**Files to Fix:**
- Multiple files in `docs/00-GETTING-STARTED/`
- `docs/DASHBOARD.md`
- Various other docs

**Pattern to Fix:**
```markdown
# Wrong:
See [07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md]

# Correct:
See [docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md]
```

### 3. Hallucination Prevention Doc ✅
**Issue:** Some references missing path
**Reality:** Located at `docs/HALLUCINATION_PREVENTION.md`
**Fix:** Use full path in all references

### 4. All lib/ README Files ✅ EXIST!
The validator incorrectly flagged these as missing. They all exist:
- ✅ `lib/agents/README.md`
- ✅ `lib/auth/README.md`
- ✅ `lib/integrations/README.md`
- ✅ `lib/monitoring/README.md`
- ✅ `lib/queue/README.md`
- ✅ `lib/utils/README.md`
- ✅ `lib/woocommerce-api/README.md`

**No action needed** - validator needs improvement to handle these patterns.

---

## ❌ CONFIRMED: Files That Don't Exist

### 1. Privacy Export Route ❌
**Path:** `app/api/privacy/export/route.ts`
**Status:** Does not exist (only `app/api/privacy/delete/` exists)
**Impact:** HIGH - Referenced in CLAUDE.md

**Referenced In:**
- `CLAUDE.md` (line 289)
- `docs/00-GETTING-STARTED/glossary.md` (line 248)
- `docs/01-ARCHITECTURE/decisions.md` (line 437)

**Options:**
1. Create the file if privacy export is a planned feature
2. Update docs to remove references
3. Change to existing privacy API endpoint

**Recommended Action:**
```bash
# Check what privacy APIs actually exist:
ls -R app/api/privacy/

# Result shows only:
# app/api/privacy/README.md
# app/api/privacy/delete/

# Decision: Update docs to correct API path or create export endpoint
```

### 2. Deprecated Chat Routes ❌
**Paths:**
- `app/api/chat-intelligent/route.ts`
- `app/api/chat-optimized/route.ts`

**Status:** These were refactored into `app/api/chat/route.ts`
**Impact:** MEDIUM - Only referenced in archived analysis docs

**Referenced In:**
- `docs/ARCHIVE/analysis/AGENTIC_SEARCH_ENHANCEMENT_PLAN.md`
- `docs/ARCHIVE/analysis/DEPLOYMENT_SUMMARY.md`
- `docs/ARCHIVE/analysis/OPTIMIZATION_SUMMARY.md`
- Multiple other archive documents

**Recommended Action:**
Archive these docs are historical - add disclaimer at top:
```markdown
> **⚠️ ARCHIVED DOCUMENT**
> This document references deprecated implementations.
> Current chat implementation: `app/api/chat/route.ts`
```

### 3. Test Files with Wrong Extensions ❌
**Pattern:** References to `*.test.ts` for component tests
**Reality:** Component tests use `.test.tsx`
**Impact:** LOW - Developers can usually figure this out

**Examples:**
- `__tests__/api/hello/route.test.ts` (should be .test.tsx if it tests React)
- `__tests__/lib/chat/conversation-manager.test.ts` (probably correct as .ts)

**Recommended Action:**
Review each reference individually - some are correct, some need .tsx

### 4. Missing Documentation Files ❌
These are referenced but don't exist:

**High Priority:**
- `docs/GETTING_STARTED.md` (referenced in README.md)
- `docs/PRIVACY_COMPLIANCE.md` (referenced in README.md)
- `docs/api/CHAT_API.md`
- `docs/api/PRIVACY_API.md`

**Medium Priority:**
- Various guide files referenced in README.md (lines 150-181)
- `CONTRIBUTING.md` (referenced in README.md line 292)
- `LICENSE` (referenced in README.md line 314)

**Low Priority:**
- Example file paths in code snippets (intentional placeholders)

---

## 🔧 Quick Fix Scripts

### Fix #1: Update Provider Paths
```bash
# Dry run - see what would change
find docs -name "*.md" -exec sed -n '/\.\/providers\/woocommerce-provider/p' {} +

# Apply fix
find docs -name "*.md" -exec sed -i '' 's|./providers/woocommerce-provider|lib/agents/providers/woocommerce-provider|g' {} +
find . -maxdepth 1 -name "*.md" -exec sed -i '' 's|./providers/woocommerce-provider|lib/agents/providers/woocommerce-provider|g' {} +
```

### Fix #2: Add docs/ Prefix to Architecture Links
```bash
# This is more complex - need to be careful not to break existing correct paths
# Recommend manual review for each file
```

### Fix #3: Add Archive Disclaimer
```bash
# Create a script to add disclaimer to all archive docs
cat > scripts/add-archive-disclaimer.sh << 'EOF'
#!/bin/bash
for file in docs/ARCHIVE/analysis/*.md; do
  # Check if disclaimer already exists
  if ! grep -q "ARCHIVED DOCUMENT" "$file"; then
    # Add disclaimer at top
    echo -e "> **⚠️ ARCHIVED DOCUMENT**\n> This is a historical document that may reference deprecated implementations.\n> For current implementation, see main documentation.\n\n$(cat "$file")" > "$file"
  fi
done
EOF

chmod +x scripts/add-archive-disclaimer.sh
./scripts/add-archive-disclaimer.sh
```

---

## 📋 Action Plan (Priority Order)

### Phase 1: Critical Fixes (Do First) ⚡
**Time: 2-3 hours**

- [ ] **Fix CLAUDE.md** - Primary developer reference
  - [ ] Update privacy export path or remove reference
  - [ ] Fix provider import paths
  - [ ] Verify all other paths

- [ ] **Fix README.md** - Public documentation
  - [ ] Create or link to GETTING_STARTED.md
  - [ ] Create or link to PRIVACY_COMPLIANCE.md
  - [ ] Update documentation links (lines 150-181)
  - [ ] Add CONTRIBUTING.md or remove reference
  - [ ] Add LICENSE or remove reference

### Phase 2: Path Corrections (Do Second) 🔧
**Time: 1-2 hours**

- [ ] **Provider Paths** - Run fix script
  - [ ] Test that all imports work correctly
  - [ ] Verify code examples are accurate

- [ ] **Database Schema Paths** - Standardize format
  - [ ] Add `docs/` prefix where missing
  - [ ] Use consistent relative vs absolute paths

- [ ] **Privacy API References** - Decide on correct path
  - [ ] Either create `app/api/privacy/export/route.ts`
  - [ ] Or update all references to correct endpoint

### Phase 3: Archive Cleanup (Do Third) 📦
**Time: 1 hour**

- [ ] **Add Archive Disclaimers** - Run script
  - [ ] Test that disclaimer looks good
  - [ ] Commit all archive updates

### Phase 4: Documentation Creation (Optional) 📝
**Time: 4-8 hours**

- [ ] Create missing high-priority docs
  - [ ] `docs/GETTING_STARTED.md`
  - [ ] `docs/PRIVACY_COMPLIANCE.md`
  - [ ] `docs/api/CHAT_API.md`
  - [ ] `docs/api/PRIVACY_API.md`

### Phase 5: CI/CD Integration (Long Term) 🚀
**Time: 2-3 hours**

- [ ] **Add GitHub Action** - Validate on PR
  - [ ] Create `.github/workflows/doc-validation.yml`
  - [ ] Test that it catches new broken references

- [ ] **Add Pre-commit Hook** - Validate before commit
  - [ ] Install husky
  - [ ] Add doc validation hook

---

## 🎯 Success Criteria

After completing Phase 1-3:
- ✅ CLAUDE.md has no broken references
- ✅ README.md has no broken references
- ✅ All provider imports use correct paths
- ✅ Archive docs have disclaimers
- ✅ Validator shows >85% valid references (up from 61%)

After Phase 4-5:
- ✅ All high-priority docs exist
- ✅ CI/CD prevents new broken references
- ✅ Validator shows >95% valid references

---

## 📊 Current State Summary

| Category | Status | Count |
|----------|--------|-------|
| Total References | 🔍 | 2,756 |
| Valid | ✅ | 1,681 (61%) |
| Broken (need fixing) | ❌ | 152 (5.5%) |
| Placeholders (OK) | ⚠️ | 923 (33.5%) |

**Goal:** Increase valid references to 95%+ (2,600+)

---

## 🚀 Getting Started

1. **Run the validator:**
   ```bash
   npx tsx scripts/verify-doc-references.ts
   ```

2. **Start with CLAUDE.md:**
   ```bash
   # Review and fix CLAUDE.md first
   code CLAUDE.md
   ```

3. **Then fix README.md:**
   ```bash
   # Review and fix README.md second
   code README.md
   ```

4. **Run validator again:**
   ```bash
   # See improvement
   npx tsx scripts/verify-doc-references.ts
   ```

---

**Next Steps:** Start with Phase 1, then move through phases sequentially.
