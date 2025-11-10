# Agent Knowledge Base Automation

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-10
**Purpose:** Automate regeneration of AI agent knowledge base from E2E tests

---

## Quick Start

```bash
# One-time setup (installs git hooks)
npm run agent:setup-hooks

# That's it! Everything else is automatic.
```

---

## What Gets Automated

When you modify E2E test files (`__tests__/playwright/**/*.spec.ts`), the agent knowledge base automatically regenerates.

**Updated Files:**
- `docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md` - Workflow extraction
- `docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md` - Human-readable guide
- `docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json` - Machine-readable data

---

## How It Works

### Local Development (Git Hook)

```
1. You modify E2E test file
2. You commit changes
3. Post-commit hook detects E2E test changes
4. Workflows extracted automatically
5. Agent knowledge generated automatically
6. Updated docs appear as uncommitted changes
7. You commit the docs (git add docs/10-ANALYSIS/)
```

**Benefits:**
- ✅ Instant feedback
- ✅ See changes before pushing
- ✅ Catch documentation issues early

### CI/CD (GitHub Actions)

```
1. You push E2E test changes
2. GitHub Actions detects changed files
3. Workflows extracted automatically
4. Agent knowledge generated automatically
5. Updated docs auto-committed to repo
6. Knowledge base always current
```

**Benefits:**
- ✅ Zero manual work
- ✅ Team-wide consistency
- ✅ Never forget to regenerate

---

## Available Commands

### Setup

```bash
# Install automation hooks
npm run agent:setup-hooks
```

### Manual Regeneration

```bash
# Quick regeneration (both steps)
npm run agent:regenerate

# Step-by-step
npm run agent:extract-workflows      # Extract from E2E tests
npm run agent:generate-knowledge     # Generate AI knowledge base
```

### Workflow

```bash
# Typical workflow after modifying E2E tests:
git add __tests__/playwright/my-new-test.spec.ts
git commit -m "test: add new E2E test for feature X"
# → Post-commit hook runs automatically
# → Check git status to see regenerated docs
git add docs/10-ANALYSIS/
git commit -m "docs: regenerate agent knowledge base"
git push
# → GitHub Actions auto-commits if you forgot locally
```

---

## Files Involved

### Automation Scripts

**GitHub Actions:**
- `.github/workflows/regenerate-agent-knowledge.yml`
  - Triggers on E2E test changes pushed to repo
  - Auto-commits regenerated documentation

**Git Hooks:**
- `scripts/git-hooks/post-commit-regenerate-agent-knowledge.sh`
  - Runs after local commits
  - Only processes when E2E tests changed
  - Creates uncommitted changes for you to review

**Setup:**
- `scripts/setup-git-hooks.sh`
  - Installs git hooks
  - Backs up existing hooks safely

### Generation Scripts

**Workflow Extraction:**
- `scripts/extract-workflows-from-e2e.ts`
  - Parses E2E test files using TypeScript AST
  - Extracts step-by-step workflows
  - Outputs: `WORKFLOWS_FROM_E2E_TESTS.md`

**Agent Knowledge Generation:**
- `scripts/generate-agent-training-data.ts`
  - Converts workflows to AI-optimized format
  - Infers intents, preconditions, success criteria
  - Outputs: `AGENT_KNOWLEDGE_BASE.md` and `.json`

---

## What Gets Generated

### WORKFLOWS_FROM_E2E_TESTS.md

Human-readable workflow documentation:

```markdown
## Complete Purchase Flow

**Source:** __tests__/playwright/core-journeys/complete-purchase-flow.spec.ts

**Steps:**
1. navigate → /widget-test (line 28)
2. click → iframe#chat-widget-iframe (line 29)
3. fill → input[type="text"] (value: "Show me products") (line 36)
...
```

### AGENT_KNOWLEDGE_BASE.md

AI-optimized training guide:

```markdown
### Complete Purchase Flow

**Intent:** Complete a product purchase from discovery to order confirmation

**Preconditions:**
- User must have network access to application
- Products must be available in catalog

**Steps:**
1. Navigate to widget test page
   - Action: navigate
   - Target: /widget-test
   - Expected: Page loads successfully
...

**Success Indicators:**
- ✅ Order confirmation page displayed
- ✅ Order exists in database
```

### AGENT_KNOWLEDGE_BASE.json

Machine-readable structured data:

```json
{
  "workflows": [
    {
      "id": "complete-purchase-flow",
      "name": "Complete Purchase Flow",
      "intent": "Complete a product purchase...",
      "preconditions": [...],
      "steps": [...],
      "successIndicators": [...]
    }
  ]
}
```

---

## Troubleshooting

### Git hook not running

```bash
# Re-run setup
npm run agent:setup-hooks

# Verify hook exists
ls -la .git/hooks/post-commit

# Check hook is executable
chmod +x .git/hooks/post-commit
chmod +x scripts/git-hooks/post-commit-regenerate-agent-knowledge.sh
```

### Manual regeneration fails

```bash
# Check dependencies installed
npm install

# Run scripts individually to see errors
npm run agent:extract-workflows
npm run agent:generate-knowledge
```

### GitHub Actions not running

```bash
# Check workflow file exists
cat .github/workflows/regenerate-agent-knowledge.yml

# Check you pushed E2E test changes
git log --oneline --name-only | grep "playwright.*\.spec\.ts"

# View workflow runs
# Go to: https://github.com/YOUR_ORG/Omniops/actions
```

---

## When to Manually Regenerate

Usually not needed! But you can manually regenerate when:

1. **After batch E2E test updates** (if you want to see all changes at once)
2. **Before important deploys** (to ensure knowledge is current)
3. **When debugging extraction issues** (to test script changes)
4. **For demos** (to ensure latest workflows are documented)

```bash
npm run agent:regenerate
```

---

## Benefits Summary

**For Developers:**
- ✅ No manual work required
- ✅ Instant feedback on documentation
- ✅ Never forget to regenerate

**For AI Agents:**
- ✅ Knowledge always current
- ✅ Zero staleness
- ✅ Accurate workflow documentation

**For Teams:**
- ✅ Consistent across all developers
- ✅ CI/CD ensures repo-wide accuracy
- ✅ Knowledge base reflects latest tests

---

## Related Documentation

**Implementation Details:**
- [E2E_AGENT_TRAINING_IMPLEMENTATION_COMPLETE.md](/ARCHIVE/completion-reports-2025-11/E2E_AGENT_TRAINING_IMPLEMENTATION_COMPLETE.md)
- [ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md](/docs/10-ANALYSIS/ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md)

**E2E Testing Guidelines:**
- [CLAUDE.md](/CLAUDE.md) - Lines 1870-2132

**Generated Knowledge:**
- [WORKFLOWS_FROM_E2E_TESTS.md](/docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md)
- [AGENT_KNOWLEDGE_BASE.md](/docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md)
- [AGENT_KNOWLEDGE_BASE.json](/docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.json)

---

**Setup Once. Forget About It. Knowledge Always Current.** ✨
