# Documentation Metadata

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** None
**Estimated Read Time:** 20 minutes

## Purpose

Metadata and tracking system for documentation version control, maintenance schedules, audit procedures, and automated tooling to ensure documentation stays synchronized with code changes.

## Quick Links
- [Version Matrix](/home/user/Omniops/docs/.metadata/version-matrix.md)
- [Maintenance Schedule](/home/user/Omniops/docs/.metadata/DOCUMENTATION_MAINTENANCE_SCHEDULE.md)
- [Documentation Standards](/home/user/Omniops/CLAUDE.md#documentation-standards-for-ai-discoverability)

**Keywords:** documentation, metadata, versioning, maintenance, audit, tracking, CI/CD

---

This directory contains metadata and tracking information for the documentation system.

## Purpose

The `.metadata` directory maintains version tracking, audit history, and structural information about the documentation to ensure it stays accurate and synchronized with code changes.

## Files

### `version-matrix.md`

**Primary documentation version tracking matrix.**

**Contains:**
- Current application and documentation versions
- Version history matrix (code vs docs)
- Per-document version tracking tables
- Feature documentation matrix
- Breaking changes history
- Deprecation timeline
- Version compatibility matrices
- Usage instructions for developers

**Updated:**
- **Monthly:** During scheduled documentation reviews
- **Per Release:** When application version changes
- **As-needed:** When breaking changes occur

**Review Schedule:** Monthly (first week of month)

**Last Updated:** 2025-10-24

---

### `DOCUMENTATION_MAINTENANCE_SCHEDULE.md`

**Comprehensive documentation maintenance procedures and schedules.**

**Contains:**
- Monthly review procedures (first Monday)
- Quarterly review procedures (first of quarter)
- Annual audit procedures (December 15-17)
- Review checklists and templates
- Scheduled dates for 2025-2026
- Automated reminder systems
- Responsibility assignments
- Success metrics and KPIs

**Updated:**
- **Annually:** Review and update schedules
- **As-needed:** When procedures change

**Review Schedule:** Annually

**Last Updated:** 2025-10-25

---

### `doc-structure.json` (Future)

**Automated documentation structure metadata.**

**Will contain:**
- Directory hierarchy
- Cross-references between documents
- Document dependencies
- Automated link checking results

**Status:** Planned for v1.0

---

### `review-history.json` (Future)

**Documentation review audit trail.**

**Will contain:**
- Review dates per document
- Reviewers
- Changes made
- Issues found and resolved

**Status:** Planned for v1.0

---

## Automated Tools

### Audit Script

**Location:** `/scripts/audit-doc-versions.ts`

**Usage:**
```bash
# Full audit
npm run docs:audit

# Generate report
npm run docs:audit:report

# Check specific file
npx tsx scripts/audit-doc-versions.ts --doc=README.md

# Auto-fix issues
npx tsx scripts/audit-doc-versions.ts --fix
```

**What it does:**
- Validates "Last Updated" dates
- Checks "Verified Accurate For" versions
- Detects outdated documentation (>90 days)
- Identifies broken version references
- Ensures CHANGELOG has current version
- Generates detailed audit reports

---

### Review Scheduler

**Location:** `/scripts/schedule-doc-reviews.ts`

**Usage:**
```bash
# Check if reviews are due
npm run docs:check-reviews

# Force notifications (testing)
npx tsx scripts/schedule-doc-reviews.ts --force

# Check without notifications
npx tsx scripts/schedule-doc-reviews.ts --check
```

**What it does:**
- Checks if monthly/quarterly/annual reviews are due
- Displays upcoming review schedule
- Creates GitHub issues for due reviews
- Sends Slack notifications (if configured)
- Logs review schedule to file

---

### Quick Check (Pre-commit)

**Location:** `/scripts/check-doc-versions.ts`

**Usage:**
```bash
npx tsx scripts/check-doc-versions.ts --quick
```

**What it does:**
- Fast validation for pre-commit hooks
- Checks critical files only
- Validates "Last Updated" metadata
- Ensures CHANGELOG is current
- Exits with error code if issues found

---

### CI/CD Integration

**Location:** `/.github/workflows/doc-version-check.yml`

**Runs on:**
- Pull requests modifying docs
- Pushes to main/develop branches
- Release tagging

**Actions:**
- Runs full documentation audit
- Uploads audit report as artifact
- Posts PR comment with results
- Checks version consistency
- Fails CI if critical docs are outdated

---

## Maintenance Schedule

**Full details:** See `DOCUMENTATION_MAINTENANCE_SCHEDULE.md` in this directory

### Quick Reference

| Type | Frequency | Next Review | Time |
|------|-----------|-------------|------|
| **Monthly** | First Monday | Nov 3, 2025 | 2-4 hours |
| **Quarterly** | First of quarter | Jan 1, 2026 | 1-2 days |
| **Annual** | December 15-17 | Dec 15-17, 2025 | 3 days |

### Monthly (First Monday)

**Tasks:**
- [ ] Run: `npm run docs:audit:report`
- [ ] Review audit report: `docs/reports/doc-version-audit.md`
- [ ] Update outdated critical docs (10 docs)
- [ ] Update version-matrix.md with review date
- [ ] Fix any warnings or failures

**Time:** 2-4 hours
**Responsible:** Primary Documentation Maintainer

---

### Per Release

**Tasks:**
- [ ] Update application version in package.json
- [ ] Update CHANGELOG.md with changes
- [ ] Update version-matrix.md:
  - [ ] Current Version Status section
  - [ ] Version Matrix table (add new row)
  - [ ] Breaking Changes History (if applicable)
  - [ ] Feature Documentation Matrix (new features)
  - [ ] Deprecation Timeline (if applicable)
- [ ] Run audit: `npx tsx scripts/audit-doc-versions.ts`
- [ ] Fix any failures before release
- [ ] Tag release in git

**Responsible:** Release Manager

---

### Quarterly (Every 3 Months)

**Tasks:**
- [ ] Review all feature documentation
- [ ] Update architecture documentation
- [ ] Review and update setup guides
- [ ] Check for deprecated features to remove
- [ ] Update training materials
- [ ] Verify external dependency versions
- [ ] Update browser compatibility matrix

**Responsible:** Documentation Team

---

## How to Update

### When Code Changes

1. **Identify affected documentation**
   - Check feature documentation matrix in `version-matrix.md`
   - Find related docs in "Per-Document Version Tracking" table

2. **Update documentation content**
   - Make necessary changes to doc files
   - Update code examples
   - Add/modify sections as needed

3. **Update metadata**
   - Set "Last Updated" to today's date
   - Set "Verified Accurate For" to current version
   - Update version-matrix.md if new features added

4. **Validate changes**
   ```bash
   npx tsx scripts/audit-doc-versions.ts --doc=<your-file>
   ```

5. **Commit changes**
   - Include doc updates in same PR as code changes
   - CI will validate automatically

---

### When Releasing

1. **Before release:**
   ```bash
   # Run full audit
   npx tsx scripts/audit-doc-versions.ts --report

   # Review report
   cat docs/reports/doc-version-audit.md

   # Fix any failures
   npx tsx scripts/audit-doc-versions.ts --fix
   ```

2. **Update version files:**
   - `package.json` - bump version
   - `CHANGELOG.md` - move [Unreleased] to [X.X.X]
   - `version-matrix.md` - update Current Version Status

3. **After release:**
   - Tag release in git
   - Update deployment docs if needed
   - Announce changes

---

### When Adding New Documentation

1. **Create document with metadata:**
   ```markdown
   # Document Title

   **Last Updated:** YYYY-MM-DD
   **Verified Accurate For:** vX.X.X

   <!-- content -->
   ```

2. **Add to version-matrix.md:**
   - Add row to appropriate tracking table
   - Add to Feature Documentation Matrix (if feature doc)
   - Set review schedule

3. **Validate:**
   ```bash
   npx tsx scripts/audit-doc-versions.ts --doc=<new-file>
   ```

---

## Best Practices

### Documentation Versioning

**DO:**
- ✅ Update "Last Updated" date when making changes
- ✅ Keep "Verified Accurate For" current
- ✅ Run audit before committing
- ✅ Include doc updates in same PR as code
- ✅ Add CHANGELOG entries for all changes
- ✅ Document breaking changes immediately

**DON'T:**
- ❌ Commit docs without updating metadata
- ❌ Let critical docs go >90 days without review
- ❌ Make breaking changes without migration guide
- ❌ Skip CI checks for "just docs" PRs
- ❌ Leave deprecated features undocumented

---

### Review Process

**Critical Docs (Monthly):**
1. Read through entire document
2. Test all code examples
3. Verify all links work
4. Check for outdated version references
5. Update metadata
6. Commit changes

**Feature Docs (Quarterly):**
1. Verify feature still works as documented
2. Check for new features to document
3. Update examples with current best practices
4. Verify compatibility information
5. Update metadata

**Reference Docs (Annually):**
1. Full review of content
2. Update for current versions
3. Remove obsolete information
4. Add new reference material
5. Update metadata

---

## Troubleshooting

### Audit Failures

**Issue:** `Missing "Last Updated" metadata`

**Fix:**
```bash
npx tsx scripts/audit-doc-versions.ts --fix
```

Or manually add to document:
```markdown
**Last Updated:** 2025-10-24
```

---

**Issue:** `Verified for vX.X.X but current is vY.Y.Y`

**Fix:** Review document, update if needed, then:
```markdown
**Verified Accurate For:** v0.1.0
```

---

**Issue:** `Last updated 120 days ago (>90 days)`

**Fix:** Review document for accuracy, make updates, then update date:
```markdown
**Last Updated:** 2025-10-24
```

---

**Issue:** `CHANGELOG.md missing entry for vX.X.X`

**Fix:** Add entry to CHANGELOG:
```markdown
## [0.1.0] - 2025-10-24

### Added
- Feature X
```

---

### CI/CD Issues

**Issue:** PR blocked by doc version check

**Fix:**
1. Check audit report artifact in GitHub Actions
2. Run locally: `npx tsx scripts/audit-doc-versions.ts --report`
3. Fix issues identified
4. Push updated docs
5. CI will re-run automatically

---

**Issue:** Pre-commit hook fails

**Fix:**
```bash
# See what's wrong
npx tsx scripts/check-doc-versions.ts --quick

# Fix issues
npx tsx scripts/audit-doc-versions.ts --fix

# Try commit again
git commit -m "..."
```

---

## Future Enhancements

### Planned for v1.0

- [ ] Automated link checking
- [ ] Cross-reference validation
- [ ] Documentation coverage metrics
- [ ] Automated screenshot updates
- [ ] API documentation sync
- [ ] Interactive documentation browser

### Planned for v2.0

- [ ] AI-powered documentation suggestions
- [ ] Automated example code testing
- [ ] Documentation search optimization
- [ ] Multi-language documentation support
- [ ] Documentation analytics dashboard

---

## Questions?

**Documentation Issues:**
- File issue: GitHub Issues → Documentation
- Tag: `documentation`, `needs-review`

**Tool Issues:**
- File issue: GitHub Issues → Tooling
- Tag: `tooling`, `documentation`

**Questions:**
- Slack: #documentation channel
- Email: docs@yourcompany.com

---

**Last Updated:** 2025-10-25
**Maintained By:** Development Team
**Review Schedule:** Quarterly

---

## NPM Scripts

```bash
# Documentation maintenance
npm run docs:audit              # Run version audit
npm run docs:audit:report       # Generate detailed report
npm run docs:check-reviews      # Check review schedule
```
