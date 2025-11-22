# GitHub Workflows Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-22
**Verified For:** v0.1.0
**Dependencies:** [.github/workflows/](.github/workflows/)
**Estimated Read Time:** 5 minutes

## Purpose
This guide documents all GitHub Actions workflows in the Omniops repository, their purposes, triggers, and optimization strategies.

## Quick Links
- [Workflow Files](/.github/workflows/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Table of Contents
- [Workflow Overview](#workflow-overview)
- [Individual Workflows](#individual-workflows)
- [Workflow Pipeline](#workflow-pipeline)
- [Optimization Strategies](#optimization-strategies)
- [Cost Considerations](#cost-considerations)

---

## Workflow Overview

The Omniops CI/CD pipeline consists of 6 specialized workflows:

| Workflow | Purpose | Trigger | Runtime |
|----------|---------|---------|---------|
| **Unit & Integration Tests** | Core test suite | Code changes | ~5 min |
| **E2E Tests** | UI/workflow validation | Code/UI changes | ~10-15 min |
| **Brand Check** | Multi-tenancy validation | All changes | ~2 min |
| **Root Directory Check** | File organization | All changes | ~1 min |
| **Performance Testing** | Nightly benchmarks | 2 AM UTC daily | ~30 min |
| **Agent Knowledge Regeneration** | AI training data | E2E test changes | ~3 min |

## Individual Workflows

### 1. Unit & Integration Tests (`test.yml`)

**Purpose:** Run unit and integration tests to validate business logic and API functionality.

**Triggers:**
- Push to main/develop branches
- Pull requests to main/develop
- Manual dispatch
- **Ignores:** Documentation, E2E tests, workflow files

**Key Features:**
- TypeScript type checking
- ESLint validation
- Code coverage reporting via Codecov
- Memory optimization with 4GB heap

**Success Criteria:**
- All unit tests pass
- All integration tests pass
- No TypeScript errors
- No linting violations

### 2. E2E Tests (`e2e-tests.yml`)

**Purpose:** Validate complete user workflows and UI functionality across browsers.

**Triggers:**
- Pull requests (when app/component/lib files change)
- Push to main branch
- After Unit & Integration Tests complete successfully
- Manual dispatch

**Key Features:**
- **3-way sharding** for parallel execution (3x faster)
- Multi-browser support (Chromium, Firefox, WebKit)
- HTML report generation with screenshots
- PR comments with results
- Artifact retention for debugging

**Optimization:**
- Runs ONLY when relevant files change
- Can be triggered after unit tests pass
- Cancels in-progress runs for same PR

### 3. Brand Check (`brand-check.yml`)

**Purpose:** Ensure the codebase remains brand-agnostic for multi-tenant support.

**Triggers:**
- All pushes to main/develop
- All pull requests

**What it checks:**
- No hardcoded company names (e.g., "Thompson's")
- No hardcoded product types (e.g., "pumps")
- No hardcoded domains or emails
- No industry-specific assumptions

**Failure Action:**
- Blocks PR merge
- Provides detailed violation report

### 4. Root Directory Check (`check-root-directory.yml`)

**Purpose:** Enforce proper file organization and prevent root directory clutter.

**Triggers:**
- All pushes to main/develop
- All pull requests

**What it validates:**
- Only configuration files in root
- Test files in `__tests__/`
- Scripts in `scripts/`
- Documentation in `docs/`
- Reports in `ARCHIVE/`

**Failure Action:**
- Blocks PR merge
- Comments on PR with placement rules
- Suggests correct locations

### 5. Performance Testing (`performance-nightly.yml`)

**Purpose:** Detect performance regressions and validate performance budgets.

**Triggers:**
- **Nightly at 2 AM UTC**
- Manual dispatch
- Push to main (if performance tests change)

**Key Features:**
- Redis service for job queue testing
- Performance budget validation
- Baseline comparison
- Artifact retention (30 days)
- GitHub Actions summary with metrics

**Metrics Tracked:**
- API response times (p50, p95, p99)
- Memory usage
- Database query performance
- Bundle size

### 6. Agent Knowledge Regeneration (`regenerate-agent-knowledge.yml`)

**Purpose:** Automatically update AI training data when E2E tests change.

**Triggers:**
- Push with changes to E2E test files
- Manual dispatch

**Process:**
1. Extract workflows from E2E tests
2. Generate AI-optimized knowledge base
3. Commit changes if documentation updated
4. Skip CI to avoid infinite loop

**Generated Files:**
- `WORKFLOWS_FROM_E2E_TESTS.md`
- `AGENT_KNOWLEDGE_BASE.md`
- `AGENT_KNOWLEDGE_BASE.json`

## Workflow Pipeline

The optimized workflow pipeline follows this sequence:

```
Code Push/PR
    ├─→ Brand Check (2 min)
    ├─→ Root Directory Check (1 min)
    └─→ Unit & Integration Tests (5 min)
            └─→ E2E Tests (10-15 min, only if tests pass)

Nightly:
    └─→ Performance Testing (30 min at 2 AM UTC)

On E2E Changes:
    └─→ Agent Knowledge Regeneration (3 min)
```

## Optimization Strategies

### 1. Path Filtering
Workflows ignore irrelevant file changes:
- Documentation changes don't trigger tests
- E2E test changes don't trigger unit tests
- Workflow file changes are isolated

### 2. Workflow Chaining
E2E tests can be triggered after unit tests pass, preventing wasted runs on broken code.

### 3. Concurrency Control
- E2E tests use concurrency groups to cancel duplicate runs
- Only one E2E test suite runs per PR at a time

### 4. Sharding
E2E tests split across 3 parallel runners, reducing total runtime by ~66%.

### 5. Selective Triggers
- Performance tests run nightly, not on every push
- Agent knowledge regenerates only when E2E tests change

## Cost Considerations

### Estimated Monthly Usage
Based on typical development patterns:

| Workflow | Runs/Month | Minutes/Run | Total Minutes |
|----------|------------|-------------|---------------|
| Unit/Integration | 200 | 5 | 1,000 |
| E2E Tests | 150 | 15 | 2,250 |
| Brand Check | 200 | 2 | 400 |
| Root Check | 200 | 1 | 200 |
| Performance | 30 | 30 | 900 |
| Agent Knowledge | 20 | 3 | 60 |
| **TOTAL** | | | **4,810 minutes** |

### Cost Optimization Tips
1. **Use path filters** - Already implemented, saves ~30% on unnecessary runs
2. **Cancel in-progress** - Already implemented for E2E tests
3. **Shard long tests** - E2E tests use 3-way sharding
4. **Schedule heavy tests** - Performance tests run nightly
5. **Chain dependent workflows** - E2E can wait for unit tests

## Troubleshooting

### Common Issues

**E2E Tests Failing:**
- Check if dev server started correctly
- Verify Playwright browsers installed
- Check test artifacts for screenshots

**Performance Tests Timing Out:**
- Increase timeout from 30 to 45 minutes
- Check if Redis service is healthy
- Verify dev server memory allocation

**Workflows Not Triggering:**
- Check path filters match changed files
- Verify branch protection rules
- Check GitHub Actions quota

## Best Practices

1. **Always test locally first** - Use `npm test` and `npm run test:e2e` before pushing
2. **Use manual dispatch** - For debugging specific workflows
3. **Monitor artifacts** - Download and review test reports
4. **Keep workflows focused** - Each workflow has one clear purpose
5. **Document changes** - Update this guide when modifying workflows

## Future Improvements

- [ ] Add caching for Playwright browsers
- [ ] Implement test result trending
- [ ] Add flaky test detection
- [ ] Create deployment workflow for production
- [ ] Add security scanning workflow