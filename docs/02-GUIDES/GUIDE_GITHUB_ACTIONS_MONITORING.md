# GitHub Actions CI/CD Monitoring Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [scripts/validate-doc-links.ts](../../scripts/validate-doc-links.ts)
- [scripts/fix-doc-links.ts](../../scripts/fix-doc-links.ts)
- [scripts/audit-doc-versions.ts](../../scripts/audit-doc-versions.ts)
**Estimated Read Time:** 20 minutes

## Purpose
Comprehensive operational guide for monitoring and managing two automated GitHub Actions workflows that validate documentation links (fixing 509+ broken links with auto-repair) and audit version metadata consistency across 1,475+ documentation links with 30-day artifact retention and automated PR commenting.

## Quick Links
- [Workflow Status](#workflow-status)
- [Local Testing](#local-testing)
- [Viewing GitHub Actions Results](#viewing-github-actions-results)
- [Fixing Failing Workflows](#fixing-failing-workflows)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Workflow Configuration Reference](#workflow-configuration-reference)

## Keywords
GitHub Actions, CI/CD workflows, documentation validation, link checking, version auditing, automated testing, PR comments, workflow artifacts, continuous integration, doc-link-check.yml, doc-version-check.yml, npx tsx scripts, workflow monitoring, GitHub bot comments, artifact retention, auto-fix automation, workflow triggers

## Aliases
- "GHA" (also known as: GitHub Actions, Actions workflows, CI/CD pipelines)
- "doc-link-check.yml" (also known as: link validation workflow, documentation link checker)
- "doc-version-check.yml" (also known as: version audit workflow, documentation version checker)
- "artifacts" (also known as: workflow reports, CI reports, validation reports)
- "PR comments" (also known as: bot comments, automated comments, workflow feedback)
- "auto-fix" (also known as: automatic repair, automated link fixes, self-healing validation)

---

## Overview

This document provides comprehensive guidance for monitoring and managing the automated documentation quality control workflows in the Omniops project.

---

## Workflow Status

### ✅ Active Workflows

#### 1. Documentation Link Validation
**File:** `.github/workflows/doc-link-check.yml`
**Status:** ✅ Active and configured
**Last Updated:** 2025-10-24

**Triggers:**
- Pull requests affecting:
  - `docs/**/*.md`
  - `*.md` (root-level markdown files)
  - `components/**/*.md`
  - `app/**/*.md`
  - `scripts/validate-doc-links.ts`
- Pushes to `main` or `develop` branches

**Jobs:**
1. **validate-links** - Validates all documentation links
   - Runs on: ubuntu-latest
   - Node.js: v20
   - Script: `npx tsx scripts/validate-doc-links.ts`
   - Artifacts: `link-validation-report` (30-day retention)
   - Fails on: Broken links detected
   - PR Comments: Yes (automated)

2. **auto-fix-links** - Automatically fixes broken links (develop only)
   - Runs on: ubuntu-latest
   - Node.js: v20
   - Script: `npx tsx scripts/fix-doc-links.ts`
   - Triggers: Push to develop branch only
   - Creates issues: Yes (when fixes applied)

**Referenced Scripts:**
- ✅ `scripts/validate-doc-links.ts` (exists)
- ✅ `scripts/fix-doc-links.ts` (exists)

---

#### 2. Documentation Version Check
**File:** `.github/workflows/doc-version-check.yml`
**Status:** ✅ Active and configured
**Last Updated:** 2025-10-24

**Triggers:**
- Pull requests affecting:
  - `docs/**`
  - `*.md`
  - `package.json`
- Pushes to `main` or `develop` branches

**Jobs:**
1. **check-doc-versions** - Audits documentation version metadata
   - Runs on: ubuntu-latest
   - Node.js: v20
   - Script: `npx tsx scripts/audit-doc-versions.ts --report`
   - Artifacts: `doc-version-audit-report` (30-day retention)
   - Continues on error: Yes
   - PR Comments: Yes (automated)

2. **check-version-consistency** - Validates version consistency
   - Runs on: ubuntu-latest
   - Checks: package.json, CHANGELOG.md, version-matrix.md
   - Fails on: Missing version entries

**Referenced Scripts:**
- ✅ `scripts/audit-doc-versions.ts` (exists)

---

## Local Testing

### Test Workflows Locally

Before pushing changes, test the workflows locally to ensure they pass:

```bash
# Test link validation
npx tsx scripts/validate-doc-links.ts

# Expected output:
# ✅ Valid: 864
# ❌ Broken: 509 (should be 0 for CI to pass)
# 🌐 External: 100
# ⚠️ Warnings: 2

# Test version audit
npx tsx scripts/audit-doc-versions.ts

# Expected output:
# ✓ Passed: 8
# ⚠ Warnings: 2

# Test auto-fix (dry run)
npx tsx scripts/fix-doc-links.ts --dry-run

# Apply fixes
npx tsx scripts/fix-doc-links.ts
```

### Current Status (2025-10-25)

```
Link Validation:
- Total links: 1,475
- Valid: 864
- Broken: 509 ⚠️ NEEDS ATTENTION
- External: 100
- Warnings: 2

Version Audit:
- Total docs: 10
- Passed: 8
- Warnings: 2
```

**⚠️ Action Required:** 509 broken links need to be fixed before CI will pass.

---

## Viewing GitHub Actions Results

### Navigate to Actions Tab

1. Go to: https://github.com/IDLEcreative/Omniops/actions
2. View all workflow runs and their status

### View Specific Workflow Runs

**Link Validation:**
https://github.com/IDLEcreative/Omniops/actions/workflows/doc-link-check.yml

**Version Check:**
https://github.com/IDLEcreative/Omniops/actions/workflows/doc-version-check.yml

### View Pull Request Checks

On any PR, scroll to the bottom to see:
- ✅ All checks passed
- ❌ Some checks failed
- Click "Details" to view full logs

### Download Artifacts

1. Click on a workflow run
2. Scroll to "Artifacts" section
3. Download:
   - `link-validation-report` (LINK_VALIDATION_REPORT.md)
   - `doc-version-audit-report` (doc-version-audit.md)

---

## Understanding PR Comments

### Link Validation Comment

The workflow automatically posts/updates a comment on PRs:

```markdown
## ✅ Documentation Link Validation

**Status:** All links valid

### 📊 Results

| Metric | Count | Percentage |
|--------|-------|------------|
| ✅ Valid Links | 864 | 58.6% |
| ❌ Broken Links | 0 | 0.0% |
| 🌐 External Links | 100 | 6.8% |
| ⚠️ Warnings | 2 | 0.1% |
| **Total** | **1,475** | **100%** |

**Health Score:** 65.4%
```

**Status Indicators:**
- ✅ All links valid - Ready to merge
- ❌ Broken links found - Must fix before merge
- ⚠️ Valid with warnings - Review warnings

### Version Audit Comment

```markdown
## ✅ Documentation Version Audit

**Status:** passed

[Summary details from audit report]
```

---

## Fixing Failing Workflows

### Broken Links Detected

**Problem:** CI fails with "Found X broken links"

**Solution:**

1. **Download the report:**
   ```bash
   # From CI artifacts or run locally:
   npx tsx scripts/validate-doc-links.ts
   cat LINK_VALIDATION_REPORT.md
   ```

2. **Review broken links:**
   - Check "Broken Internal Links" section
   - Note file paths and target paths

3. **Option A: Auto-fix (recommended)**
   ```bash
   # Preview fixes
   npx tsx scripts/fix-doc-links.ts --dry-run

   # Apply fixes
   npx tsx scripts/fix-doc-links.ts

   # Verify
   npx tsx scripts/validate-doc-links.ts
   ```

4. **Option B: Manual fix**
   - Edit markdown files directly
   - Update relative paths
   - Fix anchor references
   - Ensure files exist at target locations

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "docs: fix broken documentation links"
   git push
   ```

### Version Check Failed

**Problem:** CI fails with "CHANGELOG.md is missing entry for version X.X.X"

**Solution:**

1. **Check current version:**
   ```bash
   node -p "require('./package.json').version"
   ```

2. **Update CHANGELOG.md:**
   - Add entry for current version
   - OR: Use `[Unreleased]` section for in-progress changes

3. **Update version-matrix.md (if needed):**
   ```bash
   vim docs/.metadata/version-matrix.md
   ```

4. **Commit changes:**
   ```bash
   git add CHANGELOG.md docs/.metadata/version-matrix.md
   git commit -m "docs: update version documentation"
   git push
   ```

### Outdated Documentation Warning

**Problem:** CI warns "Last updated X days ago (>90 days)"

**Solution:**

1. **Review the document:**
   - Verify content is still accurate
   - Update any outdated information

2. **Update metadata:**
   ```markdown
   **Last Updated:** 2025-10-25
   **Verified Accurate For:** v0.1.0
   ```

3. **Commit changes:**
   ```bash
   git add docs/path/to/file.md
   git commit -m "docs: update and verify [filename]"
   git push
   ```

---

## Workflow Permissions

### Required Permissions

The workflows require these GitHub permissions:

```yaml
# Automatically granted to GITHUB_TOKEN:
- contents: read (checkout code)
- pull-requests: write (post comments)
- issues: write (create issues for auto-fixes)
```

**Note:** These permissions are automatically available via `secrets.GITHUB_TOKEN` in GitHub Actions.

### Troubleshooting Permission Issues

If you see permission errors:

1. **Check repository settings:**
   - Settings > Actions > General
   - Ensure "Read and write permissions" is enabled for workflows

2. **Check branch protection:**
   - Settings > Branches
   - Review required status checks

---

## Expected Behavior

### On Pull Request Creation/Update

1. **Workflows trigger automatically** when PR affects:
   - Any markdown files in `docs/`
   - Root-level `*.md` files
   - `package.json` (for version checks)

2. **CI runs checks:**
   - Link validation (2-3 minutes)
   - Version audit (1-2 minutes)

3. **Results appear:**
   - PR status checks update
   - Bot comments are posted/updated
   - Artifacts are uploaded

4. **Developer action:**
   - Review results
   - Fix issues if needed
   - Push updates (CI re-runs automatically)

### On Push to `develop`

1. **All checks run** (same as PR)

2. **Auto-fix runs** (if link validation fails):
   - Automatically fixes common issues
   - Commits changes with `[skip ci]` tag
   - Creates an issue documenting fixes

3. **Developer notification:**
   - Issue created: "🤖 Automated Documentation Link Fixes Applied"
   - Review and verify automated fixes

### On Push to `main`

1. **All checks run** (same as PR)

2. **No auto-fix** (production safety)

3. **Failures must be fixed manually**

---

## Monitoring Best Practices

### Daily Checks

- [ ] Review failed workflow runs
- [ ] Check for new issues created by auto-fix
- [ ] Monitor link validation health score

### Weekly Checks

- [ ] Review workflow run trends
- [ ] Update outdated documentation (>90 days warning)
- [ ] Check artifact storage usage

### Monthly Checks

- [ ] Audit version-matrix.md completeness
- [ ] Review workflow configurations for improvements
- [ ] Update this monitoring guide if needed

---

## Troubleshooting Common Issues

### Workflow Not Triggering

**Symptom:** Push/PR doesn't trigger workflow

**Causes:**
1. File paths don't match trigger patterns
2. Workflow file has syntax errors
3. GitHub Actions disabled for repository

**Solutions:**
```bash
# Verify workflow syntax
cat .github/workflows/doc-link-check.yml | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)"

# Check if Actions enabled
# Go to: Settings > Actions > General
# Ensure "Allow all actions" is selected

# Manually trigger workflow
# Go to: Actions > [Workflow Name] > Run workflow
```

### Scripts Fail to Run

**Symptom:** `npx tsx` commands fail in CI

**Causes:**
1. Dependencies not installed (`npm ci` missing)
2. Script file doesn't exist
3. TypeScript compilation errors

**Solutions:**
```bash
# Test locally first
npx tsx scripts/validate-doc-links.ts
npx tsx scripts/audit-doc-versions.ts

# Check script exists
ls -la scripts/*.ts

# Verify dependencies
npm install
```

### Artifacts Not Uploaded

**Symptom:** Can't download reports from workflow runs

**Causes:**
1. Report file not generated
2. Path mismatch in upload step
3. Workflow failed before upload

**Solutions:**
```bash
# Check artifact paths in workflow:
# - LINK_VALIDATION_REPORT.md (root)
# - docs/reports/doc-version-audit.md

# Verify report generation locally
npx tsx scripts/validate-doc-links.ts
ls -la LINK_VALIDATION_REPORT.md
```

### PR Comments Not Posting

**Symptom:** Bot doesn't comment on PRs

**Causes:**
1. Missing `pull-requests: write` permission
2. Script errors before comment step
3. GitHub API rate limiting

**Solutions:**
1. **Check permissions:**
   - Settings > Actions > General
   - Enable "Read and write permissions"

2. **Review workflow logs:**
   - Check for errors in "Post PR comment" step
   - Verify `github-script` action version

3. **Manual fallback:**
   - Download artifact and review locally

---

## Workflow Configuration Reference

### Trigger Patterns

```yaml
# Link validation triggers
on:
  pull_request:
    paths:
      - 'docs/**/*.md'      # All docs markdown
      - '*.md'              # Root markdown
      - 'components/**/*.md'
      - 'app/**/*.md'
      - 'scripts/validate-doc-links.ts'
  push:
    branches:
      - main
      - develop
```

### Script Commands

```bash
# Link validation
npx tsx scripts/validate-doc-links.ts

# Auto-fix links
npx tsx scripts/fix-doc-links.ts
npx tsx scripts/fix-doc-links.ts --dry-run

# Version audit
npx tsx scripts/audit-doc-versions.ts
npx tsx scripts/audit-doc-versions.ts --report
```

### Artifact Paths

```
link-validation-report → LINK_VALIDATION_REPORT.md
doc-version-audit-report → docs/reports/doc-version-audit.md
```

---

## Integration with Development Workflow

### Before Creating PR

```bash
# 1. Run validations locally
npx tsx scripts/validate-doc-links.ts
npx tsx scripts/audit-doc-versions.ts

# 2. Fix issues
npx tsx scripts/fix-doc-links.ts

# 3. Update versions if needed
vim CHANGELOG.md
vim docs/.metadata/version-matrix.md

# 4. Commit all changes
git add .
git commit -m "docs: update documentation"
git push
```

### During PR Review

1. **Check CI status** at bottom of PR
2. **Review bot comments** for detailed results
3. **Download artifacts** if issues found
4. **Push fixes** and wait for re-run

### After PR Merge

1. **Monitor main branch** workflow runs
2. **Check for issues** created by auto-fix
3. **Verify artifacts** are generated successfully

---

## Future Enhancements

### Planned Improvements

- [ ] Add workflow for spell-checking
- [ ] Implement scheduled runs (weekly health checks)
- [ ] Add performance benchmarks for scripts
- [ ] Create dashboard for documentation health metrics
- [ ] Add notifications for critical failures

### Configuration Options

```yaml
# Potential future additions:
- schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
- workflow_dispatch:     # Manual trigger
    inputs:
      dry_run:
        description: 'Run in dry-run mode'
        required: false
        default: 'false'
```

---

## Support and Contact

**Issues:** https://github.com/IDLEcreative/Omniops/issues
**Workflow Logs:** https://github.com/IDLEcreative/Omniops/actions
**Documentation:** See this guide and linked script files

**Quick Help:**
```bash
# Get help for any script
npx tsx scripts/validate-doc-links.ts --help
npx tsx scripts/audit-doc-versions.ts --help
npx tsx scripts/fix-doc-links.ts --help
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-25 | Initial monitoring guide created |
| 1.0.0 | 2025-10-24 | Workflows created and activated |

---

**Last Verified:** 2025-10-25
**Next Review:** 2025-11-25
