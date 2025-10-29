# Documentation Validation Quick Reference

**One-page guide for fixing doc references**

---

## 🚨 Run Validator

```bash
npx tsx scripts/verify-doc-references.ts
```

---

## 🔧 Top 5 Quick Fixes

### 1. Fix Provider Paths (30 sec)
```bash
# Wrong: ./providers/woocommerce-provider
# Right: lib/agents/providers/woocommerce-provider

# Auto-fix:
find . -name "*.md" -exec sed -i '' 's|./providers/woocommerce-provider|lib/agents/providers/woocommerce-provider|g' {} +
```

### 2. Fix Schema References (Manual)
```markdown
# Wrong:
[Schema](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

# Right:
[Schema](docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
```

### 3. Fix Privacy API (Manual)
```markdown
# Wrong path (doesn't exist):
app/api/privacy/export/route.ts

# Options:
- Create the file
- OR update to: app/api/privacy/delete/route.ts
- OR remove reference
```

### 4. Add Archive Disclaimer (1 min)
```bash
# Run this script (already created):
./scripts/add-archive-disclaimer.sh
```

### 5. Update README.md Links (Manual)
```markdown
# Missing docs:
- docs/GETTING_STARTED.md → Create or link to docs/00-GETTING-STARTED/
- docs/PRIVACY_COMPLIANCE.md → Create or link to docs/02-FEATURES/privacy-compliance/
```

---

## 📊 Current Status

| Metric | Value |
|--------|-------|
| Valid | 61% (1,681 / 2,756) |
| Goal | 90%+ |
| Critical Issues | 4-6 files |

---

## ✅ Priority Files to Fix

1. **CLAUDE.md** - Developer guide (4 refs)
2. **README.md** - Public docs (15+ refs)
3. **docs/06-TROUBLESHOOTING/README.md** (20 refs)
4. **docs/00-GETTING-STARTED/glossary.md** (15 refs)

---

## 📚 Full Reports

- **Summary:** `DOC_VALIDATION_SUMMARY.md`
- **Complete Analysis:** `DOC_REFERENCE_VALIDATION_REPORT.md`
- **Step-by-Step Fixes:** `DOC_REFERENCE_FIX_CHECKLIST.md`

---

## 🎯 Success = 90%+ Valid

After fixes:
- CLAUDE.md: 100% ✅
- README.md: 100% ✅
- Overall: 90%+ ✅

---

**Time to Fix:** 2-3 hours for critical issues
**Run validator after each fix to track progress**
