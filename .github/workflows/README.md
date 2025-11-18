# GitHub Workflows

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** None
**Estimated Read Time:** 12 minutes

## Purpose

Documentation for all GitHub Actions workflows including brand-agnostic compliance checks, documentation link validation, GDPR/CCPA compliance verification, and automated review reminders.

## Quick Links

- [Brand-Agnostic Requirements](/home/user/Omniops/CLAUDE.md#-critical-brand-agnostic-application-)
- [Documentation Standards](/home/user/Omniops/CLAUDE.md#documentation-standards-for-ai-discoverability)
- [Privacy Compliance](/home/user/Omniops/docs/PRIVACY_COMPLIANCE.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Table of Contents

- [Overview](#overview)
- [Available Workflows](#available-workflows)
  - [brand-check.yml](#brand-checkyml)
  - [doc-link-check.yml](#doc-link-checkyml)
  - [doc-review-reminders.yml](#doc-review-remindersyml)
  - [doc-version-check.yml](#doc-version-checkyml)
  - [nightly-telemetry-gdpr.yml](#nightly-telemetry-gdpryml)
- [Workflow Configuration](#workflow-configuration)
- [Adding New Workflows](#adding-new-workflows)
- [Workflow Status Badges](#workflow-status-badges)
- [Secrets and Environment Variables](#secrets-and-environment-variables)
- [Troubleshooting](#troubleshooting)
- [Scheduled Workflow Times](#scheduled-workflow-times-utc)
- [Related Documentation](#related-documentation)

## Keywords

**Search Terms:** GitHub Actions, CI/CD, workflows, automation, brand-check, documentation validation, GDPR compliance, privacy checks

**Aliases:**
- "GitHub Actions" (service)
- "CI/CD pipelines" (category)
- "Automated workflows" (function)
- "Compliance checks" (feature)

---

## Overview

This directory contains GitHub Actions workflows for automated quality checks, documentation maintenance, and compliance verification.

## Available Workflows

### brand-check.yml
**Purpose:** Verify brand-agnostic compliance across the codebase

**Triggers:**
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

**What it checks:**
- No hardcoded company names in production code
- No specific product names in core logic
- Generic terminology used throughout
- Multi-tenant architecture compliance

**Allowed exceptions:**
- Test files (`__tests__/`, `*.test.ts`)
- Example documentation
- Customer-specific configuration data

**Why this matters:**
This is a **multi-tenant application** that must work for ANY business type (e-commerce, restaurants, healthcare, etc.). Hardcoding brand-specific information breaks this model.

**Reference:** See [CLAUDE.md](../../CLAUDE.md) - Brand-Agnostic Application section

**Configuration:**
```yaml
on:
  pull_request:
    paths:
      - 'app/**'
      - 'lib/**'
      - 'components/**'
  push:
    branches: [main]
```

---

### doc-link-check.yml
**Purpose:** Verify all documentation links are valid and not broken

**Triggers:**
- Pull requests affecting docs
- Scheduled: Daily at 2 AM UTC
- Manual workflow dispatch

**What it checks:**
- Internal links between docs
- Links to code files
- External documentation references
- Anchor links within documents

**Failures:**
- Broken internal links (404)
- Missing referenced files
- Dead external links
- Invalid anchor references

**Example errors:**
```
✗ docs/guide.md: Link to ../missing-file.md is broken
✗ docs/api.md: Anchor #section-not-found doesn't exist
✗ External link https://example.com/dead-link returns 404
```

**Benefits:**
- Prevents broken documentation
- Ensures discoverability of related docs
- Maintains documentation quality

---

### doc-review-reminders.yml
**Purpose:** Remind team to review and update documentation regularly

**Triggers:**
- Scheduled: Monthly on 1st of month
- Manual workflow dispatch

**What it does:**
- Identifies docs older than 90 days
- Creates GitHub issues for review
- Tags appropriate team members
- Prioritizes critical documentation

**Review criteria:**
- Last updated > 90 days
- Version mismatch with current release
- Referenced features changed
- No "Last Updated" metadata

**Created issues:**
```
Title: Documentation Review: REFERENCE_DATABASE_SCHEMA.md
Labels: documentation, needs-review

This document hasn't been updated in 120 days.
Please review for accuracy and update "Last Updated" field.

- Check schema is current
- Verify examples work
- Update version info
```

---

### doc-version-check.yml
**Purpose:** Verify documentation version metadata matches current release

**Triggers:**
- New release published
- Manual workflow dispatch

**What it checks:**
- "Verified For:" field in doc headers
- Version consistency across related docs
- Outdated version warnings in docs

**Example failure:**
```
✗ docs/API_REFERENCE.md says "Verified For: v0.1.0"
  Current version is v0.2.0 - doc needs review
```

**Auto-fix option:**
- Can automatically update version fields
- Creates PR with version bumps
- Requires manual approval

---

### nightly-telemetry-gdpr.yml
**Purpose:** Verify GDPR/CCPA compliance in telemetry and data collection

**Triggers:**
- Scheduled: Nightly at 3 AM UTC
- Pull requests affecting privacy-related code
- Manual workflow dispatch

**What it checks:**
- No PII in telemetry events
- Proper data retention enforcement
- Privacy policy compliance
- User consent verification
- Data export functionality
- Data deletion functionality

**Scanned paths:**
```yaml
paths:
  - 'app/api/privacy/**'
  - 'app/api/gdpr/**'
  - 'lib/telemetry.ts'
  - 'lib/analytics.ts'
```

**Compliance checks:**
1. **Data Collection:**
   - User consent before tracking
   - Anonymization of sensitive data
   - Clear purpose for each data point

2. **Data Retention:**
   - Automated deletion after retention period
   - Configurable retention policies
   - Enforcement of retention rules

3. **User Rights:**
   - Data export API works
   - Data deletion API works
   - Consent withdrawal honored

**Example failures:**
```
✗ Telemetry event contains user email (PII violation)
✗ Data retention policy not enforced in conversations table
✗ Missing consent check before analytics tracking
```

**Privacy compliance score:**
```
GDPR/CCPA Compliance Check

✓ Data minimization: PASS
✓ User consent: PASS
✓ Data retention: PASS
✓ Export functionality: PASS
✓ Deletion functionality: PASS
✗ Anonymization: FAIL (1 violation found)

Overall: 83% compliant (5/6 checks passed)
```

---

## Workflow Configuration

### Running Workflows Locally

Use [act](https://github.com/nektos/act) to test workflows locally:

```bash
# Install act
brew install act

# Run specific workflow
act pull_request -W .github/workflows/brand-check.yml

# Run all workflows
act -l  # List workflows
act     # Run default event
```

### Skipping Workflows

Add to commit message to skip CI:
```bash
git commit -m "docs: update README [skip ci]"
```

## Adding New Workflows

### Workflow Template

```yaml
name: Workflow Name

on:
  pull_request:
    paths:
      - 'relevant/**'
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Manual trigger

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Run check
        run: |
          npm ci
          npm run your-check-command

      - name: Report results
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Check failed',
              body: 'Details...'
            })
```

### Best Practices

1. **Minimal runs** - Only run when relevant files change
2. **Fast feedback** - Keep workflows under 5 minutes
3. **Clear errors** - Provide actionable error messages
4. **Auto-fix when safe** - Create PRs for simple fixes
5. **Manual triggers** - Always include `workflow_dispatch`

## Workflow Status Badges

Add to README.md:

```markdown
![Brand Check](https://github.com/user/repo/workflows/brand-check/badge.svg)
![Docs Check](https://github.com/user/repo/workflows/doc-link-check/badge.svg)
![GDPR Compliance](https://github.com/user/repo/workflows/nightly-telemetry-gdpr/badge.svg)
```

## Secrets and Environment Variables

### Required Secrets

Configure in GitHub Settings → Secrets:

```bash
# None currently required
# Workflows use GITHUB_TOKEN automatically
```

### Environment Variables

```yaml
env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'
```

## Troubleshooting

### "Workflow not running"
```bash
# Check trigger conditions
# Verify file paths match

# View workflow runs
gh run list --workflow=brand-check.yml
```

### "Workflow failing locally but passing on GitHub"
```bash
# Ensure act uses same Node version
act -P ubuntu-latest=node:18

# Check for environment differences
```

### "Too many workflow runs"
```bash
# Optimize path filters
on:
  pull_request:
    paths:
      - '!docs/**'  # Exclude docs
      - 'src/**'    # Only src changes
```

## Scheduled Workflow Times (UTC)

- **doc-link-check:** Daily at 2 AM
- **doc-review-reminders:** Monthly on 1st
- **nightly-telemetry-gdpr:** Daily at 3 AM

**Convert to your timezone:**
- UTC 2 AM = PST 6 PM (previous day)
- UTC 2 AM = EST 9 PM (previous day)
- UTC 3 AM = PST 7 PM (previous day)

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Brand-Agnostic Requirements](../../CLAUDE.md#-critical-brand-agnostic-application-)
- [Documentation Standards](../../CLAUDE.md#documentation-standards-for-ai-discoverability)
- [Privacy Compliance](../../docs/privacy-compliance.md)

## CI/CD Pipeline Testing

This section was added to test the automated E2E workflow trigger mechanism.

**Test Date:** 2025-11-10
**Test Purpose:** Validate E2E tests workflow runs correctly on PR creation

