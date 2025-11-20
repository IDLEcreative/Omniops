# Pull Request Merge Workflow Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-19
**Verified For:** v0.1.0
**Dependencies:**
- [CLAUDE.md](../../CLAUDE.md) - Project guidelines
- GitHub CLI (`gh`) installed and authenticated
**Estimated Read Time:** 10 minutes

## Purpose
This guide documents the opinionated, battle-tested PR workflow used for Omniops. It prioritizes **speed** (merge within hours, not days) balanced with **safety** (comprehensive testing, meaningful review).

## Table of Contents
- [Philosophy](#philosophy)
- [Pre-Merge Checklist](#pre-merge-checklist)
- [Step-by-Step Workflow](#step-by-step-workflow)
- [Merge Strategies](#merge-strategies)
- [Branch Protection Rules](#branch-protection-rules)
- [Emergency Hotfix Process](#emergency-hotfix-process)
- [PR Size Philosophy](#pr-size-philosophy)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Philosophy

**Core Principles:**
1. **Squash and merge** - Clean history is more valuable than detailed commit history
2. **Trust but verify** - Automated tests are mandatory, human review is critical
3. **Merge fast, revert faster** - Don't let PRs sit, but be ready to rollback
4. **Delete branches aggressively** - Keep the repository clean
5. **Test locally first** - Never let CI catch what you could catch locally

**Why This Matters:**
- PRs that sit for days become stale and hard to merge
- Broken code blocks the team
- Clean history makes debugging easier
- Fast feedback loops improve developer experience

---

## Pre-Merge Checklist

**Before merging ANY PR, verify:**

- [ ] **All CI/CD checks pass** (tests, linting, builds)
- [ ] **Code review approved** by at least 1-2 reviewers
- [ ] **No merge conflicts** with target branch
- [ ] **Branch is up-to-date** with base branch
- [ ] **All conversations resolved** (no outstanding review comments)
- [ ] **Documentation updated** (if applicable)
- [ ] **Breaking changes documented** (if applicable)
- [ ] **No console.log / debugger statements** left in code
- [ ] **Tests cover new code** (>80% coverage)
- [ ] **No performance regressions** (if applicable)

---

## Step-by-Step Workflow

### Step 1: Before Creating PR

**ALWAYS run these locally before pushing:**

```bash
# Run all checks locally
npm run lint           # Must pass
npm test              # Must pass
npm run build         # Must succeed
npm run test:e2e:critical  # Core journeys must work

# If any fail, fix them NOW - never push broken code
```

**Why:** Faster feedback than waiting for CI/CD. Shows discipline.

### Step 2: Create PR via GitHub CLI

```bash
# Create PR with comprehensive description
gh pr create \
  --title "feat: add real-time conversation notifications" \
  --body "$(cat <<'EOF'
## Summary
- Implemented WebSocket connection for real-time updates
- Added notification badge on new messages
- Improved UX for multi-tab scenarios

## Test Plan
- [x] Unit tests pass (12 new tests)
- [x] E2E test: notifications appear correctly
- [x] Manual testing: tested across 3 browsers
- [x] Performance: <50ms notification latency

## Breaking Changes
None

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Template Breakdown:**
- **Summary**: What changed and why (bullet points)
- **Test Plan**: How you verified it works (checkboxes)
- **Breaking Changes**: Any API changes that affect consumers
- **Attribution**: Credit Claude Code if used

### Step 3: Self-Review (Critical)

```bash
# Review your own PR first
gh pr view --web

# Checklist:
# - Any console.logs forgotten?
# - Any TODO comments that should be addressed?
# - Are variable names clear?
# - Did I update documentation?
# - Are tests comprehensive?
```

**Why:** Catch embarrassing mistakes before wasting reviewer time. Catches ~30% of issues.

### Step 4: Wait for CI/CD + Get Review

```bash
# Check status
gh pr checks

# If checks fail, investigate IMMEDIATELY
gh pr view --web  # View failure details

# Request review from specific people
gh pr edit --add-reviewer teammate1,teammate2
```

**Rule:** Don't let failing checks sit. Fix within 15 minutes or explain why they're failing.

### Step 5: Address Feedback

```bash
# Make changes based on review
git add .
git commit -m "refactor: address review feedback - extract helper function"
git push

# Re-request review if major changes
gh pr edit --add-reviewer teammate1
```

**Tip:** Small, focused commits for review changes make it easy to see what changed.

### Step 6: Merge (Recommended Method)

**Once approved + all checks pass, merge IMMEDIATELY:**

```bash
gh pr merge --squash --delete-branch --body "$(cat <<'EOF'
feat: add real-time conversation notifications

Implemented WebSocket connection for live updates with <50ms latency.
Tested across Chrome, Firefox, Safari with 100% success rate.

✅ All tests passing
✅ E2E tests verified
✅ Performance validated

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Immediately verify merge success
git checkout main
git pull origin main
npm test  # Quick sanity check

# Clean up local branch
git branch -d feature-branch
```

**Why:**
- Squash creates clean, atomic commits
- Delete branch immediately (no clutter)
- Verify locally that main is healthy
- Custom merge message preserves important context

---

## Merge Strategies

**Three main approaches - we use Squash:**

### 1. Squash and Merge ✅ (Our Default)

```bash
gh pr merge <PR#> --squash --delete-branch
```

**Pros:**
- ✅ Clean, linear history
- ✅ One commit per feature
- ✅ Easy to read git log
- ✅ Simple to revert entire feature

**Cons:**
- ❌ Loses individual commit history
- ❌ Harder to bisect bugs within feature

**Best for:** Teams prioritizing clean history (Stripe, Vercel, most SaaS)

### 2. Merge Commit (Preserves History)

```bash
gh pr merge <PR#> --merge --delete-branch
```

**Pros:**
- ✅ Complete history preserved
- ✅ Easy to revert entire feature
- ✅ Clear feature boundaries

**Cons:**
- ❌ More verbose git history
- ❌ Can clutter history with merge commits

**Best for:** Teams that value complete history and feature traceability

### 3. Rebase and Merge (Linear History)

```bash
gh pr merge <PR#> --rebase --delete-branch
```

**Pros:**
- ✅ Linear history
- ✅ Preserves individual commits
- ✅ Clean, chronological order

**Cons:**
- ❌ Rewrites commit history (dangerous if not careful)
- ❌ Requires discipline from team

**Best for:** Teams with strict linear history requirements (Linux kernel, Chromium)

---

## Branch Protection Rules

**Configure these on `main` branch:**

### Required Checks
```yaml
✅ Require pull request before merging
✅ Require 1 approval (2 for critical features)
✅ Dismiss stale reviews on new commits
✅ Require status checks to pass:
   - build
   - test (unit + integration)
   - lint
   - test:e2e:critical
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Enforce for administrators (no exceptions)
✅ Restrict force pushes (nobody can force push to main)
✅ Restrict deletions (can't delete main branch)
```

### Optional but Recommended
```yaml
⚠️ Require signed commits (for sensitive projects)
⚠️ Require linear history (if team prefers rebase)
```

**To configure:**
1. Go to repo Settings → Branches
2. Add rule for `main` branch
3. Enable all required checks above
4. Save changes

---

## Emergency Hotfix Process

**For critical production fixes:**

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-patch

# 2. Make minimal fix
# ... edit files ...

# 3. Test ONLY the fix
npm test -- path/to/affected/tests
npm run test:e2e:critical

# 4. Create PR with [HOTFIX] tag
gh pr create \
  --title "[HOTFIX] fix: patch critical security vulnerability" \
  --body "Critical security fix - requires immediate merge" \
  --label "priority:critical"

# 5. Get expedited review (ping on Slack)

# 6. Merge as soon as approved
gh pr merge <PR#> --squash --delete-branch

# 7. Verify in production immediately
# Monitor for 30 minutes
```

**Why:** Hotfixes need speed, but not at the expense of safety. Still require review and tests.

---

## PR Size Philosophy

**Aim for:**
- **Ideal:** 50-200 lines changed
- **Maximum:** 400 lines changed
- **If larger:** Break into multiple PRs

**Why:**
- Reviewers can thoroughly review <400 lines in 15-20 minutes
- >400 lines = rubber-stamp reviews = bugs slip through
- Small PRs merge faster, reduce conflicts

**How to Split Large PRs:**
1. **By feature component**: PR1 = data model, PR2 = API, PR3 = UI
2. **By refactor + feature**: PR1 = refactor prep, PR2 = new feature
3. **By module**: PR1 = backend, PR2 = frontend

---

## Common Mistakes to Avoid

### ❌ Don't:
- Merge without CI/CD checks passing
- Merge your own PR without review (except trivial docs)
- Force push to main branch (NEVER)
- Merge with unresolved conflicts
- Merge breaking changes without coordination
- Delete branches before confirming merge success
- Let PRs sit for days without action
- Create PRs with >400 lines changed
- Skip testing locally before pushing

### ✅ Do:
- Wait for all checks to pass
- Get meaningful code review
- Update branch before merging
- Write descriptive merge commit messages
- Delete merged branches immediately
- Communicate breaking changes
- Merge within hours, not days
- Self-review before requesting review
- Test locally first

---

## Verification After Merge

**Immediately after merging:**

```bash
# 1. Update local main
git checkout main
git pull origin main

# 2. Run quick sanity check
npm test

# 3. Verify production deployment (if auto-deployed)
# Check logs, monitoring, error tracking

# 4. Monitor for 15-30 minutes
# Watch for:
# - Error spikes in Sentry/logging
# - Performance regressions
# - User reports
```

**If issues detected:**
```bash
# Revert immediately
git revert <merge-commit-sha>
git push origin main

# Or create fix-forward PR if simple
```

---

## Quick Reference Commands

### Check PR Status
```bash
gh pr list                    # List all PRs
gh pr view <PR#>             # View PR details
gh pr checks <PR#>           # Check CI/CD status
gh pr view <PR#> --comments  # Read all comments
```

### Merge PR
```bash
# Squash and merge (recommended)
gh pr merge <PR#> --squash --delete-branch

# Merge commit
gh pr merge <PR#> --merge --delete-branch

# Rebase and merge
gh pr merge <PR#> --rebase --delete-branch
```

### Update Branch
```bash
git checkout main
git pull origin main
git checkout feature-branch
git merge main  # or: git rebase main
git push origin feature-branch
```

### Cleanup After Merge
```bash
git checkout main
git pull origin main
git branch -d feature-branch
git remote prune origin  # Clean up stale remote branches
```

---

## Continuous Improvement

**After every PR merge, ask:**
- Did CI catch something I missed? → Improve local checks
- Did review find major issues? → Test more thoroughly
- Did PR sit too long? → Break into smaller PRs
- Were tests insufficient? → Improve test coverage
- Did merge cause production issues? → Add better E2E tests

**Track metrics:**
- Average time to merge (target: <4 hours)
- % of PRs with failing CI (target: <5%)
- % of PRs requiring rework after review (target: <20%)
- Production incidents from merged PRs (target: 0)

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project guidelines and rules
- [Git Safety Protocol](../../CLAUDE.md#committing-changes-with-git) - Git best practices
- [Testing Approach](../../CLAUDE.md#testing-approach) - Test requirements
- [Industry Best Practices](../../CLAUDE.md#-critical-follow-industry-best-practices-) - SaaS standards

---

## Summary Checklist

**Before creating PR:**
- [ ] Run lint, tests, build locally
- [ ] Self-review code changes
- [ ] Write comprehensive PR description

**Before merging PR:**
- [ ] All CI checks green
- [ ] 1+ approval received
- [ ] All conversations resolved
- [ ] Branch up-to-date with main

**After merging PR:**
- [ ] Verify main builds
- [ ] Delete feature branch
- [ ] Monitor production for issues
- [ ] Update local main branch

---

**Remember:** Fast merges with comprehensive testing is better than slow, cautious merges. Trust your tests, review thoroughly, merge confidently, and monitor actively.
