# 🤖 Automated Testing Setup

**TL;DR:** Tests run automatically when you save files. You get instant feedback.

## Quick Start

```bash
npm run dev:full
```

That's it! This starts:
- ✅ Dev server (port 3000)
- ✅ Unit test watcher (runs on save)
- ✅ E2E test watcher (runs on file changes)

## What You Get

```
Save file
    ↓
1-2s: Unit tests run ✅/❌
    ↓
5-15s: E2E tests run ✅/❌
    ↓
Screenshots if failed 📸
```

## All Commands

```bash
# Development (automated)
npm run dev:full              # Everything (recommended)
npm run dev                   # Dev server only

# E2E Tests
npm run test:e2e:watch        # Interactive UI
npm run test:e2e:watch-files  # Auto-run on changes
npm run test:e2e:headed       # See browser
npm run test:e2e:debug        # Step-through

# Unit Tests
npm run test:watch            # Auto-run on changes
npm test                      # Run once
```

## How It Works

**On file save:**
1. File watcher detects change
2. Waits 2s for more changes (debounce)
3. Runs unit tests (~1s)
4. Runs E2E tests (~10s)
5. Shows results

**On git push:**
1. Pre-push hook runs
2. All unit tests
3. All integration tests
4. Critical E2E tests
5. Blocks push if any fail

**On GitHub push:**
1. Full CI/CD pipeline
2. All tests + coverage
3. E2E tests all browsers
4. Uploads screenshots/videos

## Files Created

| File | Purpose |
|------|---------|
| [scripts/watch-e2e.ts](scripts/watch-e2e.ts) | E2E file watcher |
| [scripts/dev-with-tests.sh](scripts/dev-with-tests.sh) | Combined dev script |
| [scripts/check-test-environment.sh](scripts/check-test-environment.sh) | Environment validation |
| [.husky/pre-push](.husky/pre-push) | Pre-push test hook |
| [.github/workflows/test.yml](.github/workflows/test.yml) | CI/CD pipeline |

## Complete Documentation

See [docs/02-GUIDES/GUIDE_AUTOMATED_TESTING.md](docs/02-GUIDES/GUIDE_AUTOMATED_TESTING.md) for full guide.

## Troubleshooting

**Tests not running?**
```bash
bash scripts/check-test-environment.sh
```

**Dev server not found?**
```bash
# Terminal 1
npm run dev

# Terminal 2 (after server ready)
npm run test:e2e:watch-files
```

**Bypass pre-push hook:**
```bash
git push --no-verify  # Use sparingly!
```

---

**Created:** 2025-11-10
**For:** AI agents and developers who want instant feedback
