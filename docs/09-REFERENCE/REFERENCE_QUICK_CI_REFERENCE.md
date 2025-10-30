# Quick CI/CD Reference Card

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 8 minutes

## Purpose
npx tsx scripts/validate-doc-links.ts npx tsx scripts/audit-doc-versions.ts

## Quick Links
- [Workflow Status at a Glance](#workflow-status-at-a-glance)
- [Quick Commands](#quick-commands)
- [View Results](#view-results)
- [Understanding CI Results](#understanding-ci-results)
- [PR Comment Guide](#pr-comment-guide)

## Keywords
commands, comment, common, file, glance, guide, issues, locations, more, need

---


**Last Updated:** 2025-10-25

---

## Workflow Status at a Glance

| Workflow | Status | Triggers | Current Issues |
|----------|--------|----------|----------------|
| **Link Validation** | ✅ Active | PR + Push (main/develop) | ⚠️ 509 broken links |
| **Version Check** | ✅ Active | PR + Push (main/develop) | ⚠️ 2 warnings |

---

## Quick Commands

### Before Creating PR
```bash
# Test everything locally
npx tsx scripts/validate-doc-links.ts
npx tsx scripts/audit-doc-versions.ts

# Fix broken links
npx tsx scripts/fix-doc-links.ts

# Verify fixes
npx tsx scripts/validate-doc-links.ts
```

### Fix Failing CI
```bash
# If link validation fails:
npx tsx scripts/fix-doc-links.ts
git add .
git commit -m "docs: fix broken links"
git push

# If version check fails:
vim CHANGELOG.md  # Add current version entry
git add CHANGELOG.md
git commit -m "docs: update changelog"
git push
```

---

## View Results

**Actions Dashboard:**
https://github.com/IDLEcreative/Omniops/actions

**Link Validation:**
https://github.com/IDLEcreative/Omniops/actions/workflows/doc-link-check.yml

**Version Check:**
https://github.com/IDLEcreative/Omniops/actions/workflows/doc-version-check.yml

---

## Understanding CI Results

### ✅ All Checks Passed
- Green checkmark on PR
- Ready to merge
- No action needed

### ❌ Link Validation Failed
- Broken links detected
- Download `link-validation-report` artifact
- Run: `npx tsx scripts/fix-doc-links.ts`
- Commit and push fixes

### ⚠️ Version Check Warning
- Outdated documentation
- Review and update affected files
- Update metadata headers

---

## PR Comment Guide

### Link Validation Comment
```
✅ All links valid
❌ X broken links found
⚠️ Valid with X warnings
```

**Health Score:** Percentage of valid + external links

### Version Audit Comment
```
✅ passed
❌ failed
⚠️ passed with warnings
```

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| CI not running | File path doesn't match trigger | Check `.github/workflows/` trigger patterns |
| Script fails | Dependencies missing | Run `npm ci` locally |
| Links broken | Files moved/renamed | Run `npx tsx scripts/fix-doc-links.ts` |
| Version mismatch | CHANGELOG outdated | Add version entry to CHANGELOG.md |

---

## File Locations

```
Workflows:
├── .github/workflows/doc-link-check.yml
├── .github/workflows/doc-version-check.yml

Scripts:
├── scripts/validate-doc-links.ts
├── scripts/fix-doc-links.ts
├── scripts/audit-doc-versions.ts

Reports:
├── LINK_VALIDATION_REPORT.md (generated)
├── docs/reports/doc-version-audit.md (generated)

Documentation:
├── docs/02-GUIDES/GUIDE_GITHUB_ACTIONS_MONITORING.md (full guide)
└── WORKFLOW_VERIFICATION_REPORT.md (verification status)
```

---

## Need More Help?

📖 **Full Guide:** `docs/02-GUIDES/GUIDE_GITHUB_ACTIONS_MONITORING.md`
📊 **Verification Report:** `WORKFLOW_VERIFICATION_REPORT.md`
🐛 **Issues:** https://github.com/IDLEcreative/Omniops/issues

---

**Quick Test:**
```bash
npx tsx scripts/validate-doc-links.ts && \
npx tsx scripts/audit-doc-versions.ts && \
echo "✅ Ready for PR!"
```
