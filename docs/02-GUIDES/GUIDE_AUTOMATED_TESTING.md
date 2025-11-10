# Automated Testing for AI Agents

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-10
**Purpose:** Complete guide to automatic test execution providing immediate feedback to AI agents

---

## 🎯 Purpose

This system provides **instant feedback** to AI agents when code changes break workflows. Tests run automatically without manual intervention, creating a tight feedback loop similar to human TDD workflow.

## 🚀 Quick Start

```bash
# Single command - starts everything
npm run dev:full
```

This starts:
1. Next.js dev server (port 3000)
2. Unit test watcher (runs on save)
3. E2E test watcher (runs on file changes)

**Result:** Every code change triggers automatic testing with results in 1-15 seconds.

---

## 📊 What Runs Automatically

### 1. File Watcher (Development)

**Triggers:** File save in `app/`, `lib/`, `components/`, `public/`

**Runs:**
- Unit tests (Jest) - 1-2 seconds
- E2E tests (Playwright) - 5-15 seconds (after 2s debounce)

**Feedback:**
```
📝 File changed: app/api/chat/route.ts
🧪 Running unit tests... ✅ Passed (1.2s)
🎭 Running E2E tests... ❌ Failed (8.5s)
❌ complete-purchase-flow.spec.ts broke
💡 Run with --headed to see what broke
```

**Implementation:** [scripts/watch-e2e.ts](../../scripts/watch-e2e.ts)

### 2. Pre-Push Hook (Git)

**Triggers:** `git push`

**Runs:**
- All unit tests
- All integration tests
- Critical E2E tests (core journeys)

**Blocks push if any fail**

**Bypass:** `git push --no-verify` (use sparingly)

**Implementation:** [.husky/pre-push](../../.husky/pre-push)

### 3. Post-Commit Hook (Git)

**Triggers:** `git commit` (when E2E tests change)

**Runs:**
- `npm run agent:extract-workflows`
- `npm run agent:generate-knowledge`

**Result:** Agent knowledge base auto-updates

**Implementation:** [scripts/git-hooks/post-commit-regenerate-agent-knowledge.sh](../../scripts/git-hooks/post-commit-regenerate-agent-knowledge.sh)

### 4. GitHub Actions (CI/CD)

**Triggers:** Push to `main`/`develop`, pull requests

**Runs:**
- Linting
- Type checking
- Unit tests (with coverage)
- Integration tests (with coverage)
- E2E tests (all browsers)
- Uploads screenshots/videos on failure

**Implementation:** [.github/workflows/test.yml](../../.github/workflows/test.yml)

---

## 🛠️ Setup & Configuration

### Initial Setup

```bash
# Install Playwright browsers
npx playwright install --with-deps

# Verify environment
bash scripts/check-test-environment.sh

# Start full development environment
npm run dev:full
```

### Environment Validation

Before running E2E tests, the system checks:
- ✅ Dev server running (port 3000)
- ✅ Playwright browsers installed
- ✅ Node.js v20+
- ✅ Test directories exist
- ✅ Environment variables set

**Manual check:**
```bash
bash scripts/check-test-environment.sh
```

### Playwright Configuration

**Automatic on failure:**
- Screenshots: `only-on-failure`
- Videos: `retain-on-failure`
- Traces: `on-first-retry` (includes DOM snapshots, network logs)

**Configuration:** [playwright.config.js](../../playwright.config.js)

---

## 📝 Available Commands

### Combined Development
```bash
npm run dev:full              # All-in-one (recommended)
npm run dev                   # Dev server only
```

### E2E Tests
```bash
npm run test:e2e              # All E2E tests (all browsers)
npm run test:e2e:chromium     # Chromium only (fastest)
npm run test:e2e:watch        # Interactive UI mode
npm run test:e2e:watch-files  # Auto-run on file changes
npm run test:e2e:critical     # Core journeys only
npm run test:e2e:headed       # Browser visible
npm run test:e2e:debug        # Step-through debugger
```

### Unit/Integration Tests
```bash
npm test                      # All tests
npm run test:watch            # Watch mode
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests only
npm run test:coverage         # With coverage report
```

---

## 🤖 AI Agent Benefits

### Before Automation
```
AI makes code change
    ↓
User tests manually later
    ↓
"You broke checkout!"
    ↓
AI fixes (without seeing the actual error)
```

### After Automation
```
AI makes code change
    ↓
File watcher detects change (instant)
    ↓
Tests run automatically (10s)
    ↓
❌ complete-purchase-flow.spec.ts failed
❌ Error: Add to cart button not found
    ↓
AI: "I see - I broke the selector. Fixing..."
    ↓
Makes targeted fix
    ↓
✅ Tests pass
```

**Key difference:** AI sees the **exact error** and can fix it immediately.

---

## 📊 Test Coverage

### Critical E2E Tests (Auto-Run)

Located: `__tests__/playwright/core-journeys/`

1. **complete-purchase-flow.spec.ts**
   - Full purchase journey
   - Chat → Product search → Add to cart → Checkout → Order confirmation
   - 20 steps, ~30s runtime

2. **landing-page-demo-flow.spec.ts**
   - Demo user experience
   - Widget installation → First chat → Product discovery
   - 15 steps, ~20s runtime

### All E2E Tests (Manual/CI)

12 test files:
- Chat widget integration
- WooCommerce integration
- GDPR privacy workflows
- Analytics dashboard
- Session metadata tracking
- Multi-turn conversations
- Domain configuration
- Widget installation
- Scraping flows

---

## 🔍 Debugging Failed Tests

### 1. View Screenshots (Automatic)

```bash
# Failed test screenshots saved to:
ls -la test-results/

# Example:
# test-results/complete-purchase-flow-chromium/test-failed-1.png
```

### 2. Watch Test Run

```bash
npm run test:e2e:headed
# Browser visible - see exactly what broke
```

### 3. Step Through Test

```bash
npm run test:e2e:debug
# Pauses at each step - inspect DOM, network
```

### 4. View Trace

```bash
npx playwright show-trace test-results/.../trace.zip
# Time-travel debugger with DOM snapshots, network logs
```

---

## ⚙️ Customization

### Change Watched Directories

Edit [scripts/watch-e2e.ts](../../scripts/watch-e2e.ts#L24-29):

```typescript
const WATCH_DIRS = [
  'app',
  'lib',
  'components',
  'public',
  'hooks',     // Add this
  'types'      // Add this
];
```

### Change Debounce Delay

Edit [scripts/watch-e2e.ts](../../scripts/watch-e2e.ts#L32):

```typescript
const DEBOUNCE_DELAY = 5000; // Wait 5s instead of 2s
```

### Run Different Tests on Watch

Edit [scripts/watch-e2e.ts](../../scripts/watch-e2e.ts#L64):

```typescript
// Current: Critical tests only
await execAsync('npm run test:e2e:critical');

// Option: All E2E tests
await execAsync('npm run test:e2e');

// Option: Specific test
await execAsync('playwright test gdpr-privacy');
```

### Disable Auto-Testing

```bash
# Just dev server (no auto-tests)
npm run dev

# Unit tests only (no E2E)
npm run test:watch

# E2E manual only
npm run test:e2e
```

---

## 📈 Performance

| Test Type | Runtime | Trigger Delay | Total Feedback |
|-----------|---------|---------------|----------------|
| Unit tests | 1-2s | Instant | 1-2s |
| E2E critical | 5-15s | 2s debounce | 7-17s |
| Full E2E suite | 2-5min | Manual | 2-5min |

**Optimization:**
- Critical tests only on watch (2 tests, 30-50s)
- Full suite on push/CI (12 tests, 2-5min)
- Parallel execution where possible

---

## 🚨 Troubleshooting

### "Dev server not running"

```bash
# Terminal 1
npm run dev

# Wait for "Ready on http://localhost:3000"

# Terminal 2
npm run test:e2e:watch-files
```

### "Playwright browsers not installed"

```bash
npx playwright install --with-deps chromium
```

### "Tests pass locally but fail in CI"

**Common causes:**
- Timing differences (CI slower)
- Environment variables missing
- Port conflicts

**Solution:**
```bash
# Check environment in CI logs
# Add debugging:
DEBUG=pw:api npm run test:e2e
```

### "File watcher not detecting changes"

**macOS file limit:**
```bash
ulimit -n 10240
```

**Add to `~/.zshrc` or `~/.bashrc`**

---

## 📚 Related Documentation

- [E2E Tests as Agent Training Data](../10-ANALYSIS/ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md)
- [Agent Knowledge Base](../10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md)
- [Testing Philosophy (CLAUDE.md)](../../CLAUDE.md#testing--code-quality-philosophy)
- [Playwright Config](../../playwright.config.js)

---

## 🎓 Best Practices

**DO:**
- ✅ Use `npm run dev:full` during active development
- ✅ Let tests run automatically - don't disable watchers
- ✅ Fix failing tests immediately (AI feedback loop)
- ✅ Check screenshots when E2E fails
- ✅ Use `--headed` mode to debug visually

**DON'T:**
- ❌ Bypass pre-push hook habitually
- ❌ Ignore failing E2E tests
- ❌ Commit broken tests
- ❌ Disable watchers to "save resources"
- ❌ Skip environment validation

---

## 🔮 Future Enhancements

**Planned:**
- [ ] Automatic git bisect on E2E failures
- [ ] AI-generated test suggestions based on code changes
- [ ] Performance regression detection
- [ ] Visual regression testing (screenshot diffs)
- [ ] Automatic bug report generation from failed tests

---

**Last Updated:** 2025-11-10
**Maintainer:** Development team
**Questions:** See [Troubleshooting](#-troubleshooting) or create GitHub issue
