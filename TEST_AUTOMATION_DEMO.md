# Test Automation Demo

This file demonstrates the automatic testing system.

## How to Test

1. **Start dev environment:**
   ```bash
   npm run dev:full
   ```

2. **Make a code change** (in another terminal):
   ```bash
   # Add a comment to any file in app/, lib/, or components/
   echo "// Test automation" >> app/layout.tsx
   ```

3. **Watch tests run automatically!**
   - Unit tests: ~1-2 seconds
   - E2E tests: ~5-15 seconds (after 2s debounce)

## What to Look For

In your `npm run dev:full` terminal, you'll see:

```
📝 File changed: app/layout.tsx
🧪 Running unit tests... ✅ Passed (1.2s)
🎭 Running E2E tests...
✅ All E2E tests passed! (12.5s)
✅ AI agents can execute workflows successfully
```

## Try Breaking Something

Edit [app/layout.tsx](app/layout.tsx) and add intentional syntax error:

```typescript
// Add this line to break something:
const broken = ;
```

**Expected Result:**
```
📝 File changed: app/layout.tsx
🧪 Running unit tests... ❌ Failed (1.5s)
❌ SyntaxError: Unexpected token ;
```

**Fix it and watch tests pass again!**

---

## View Logs in Real-Time

Open separate terminals to watch each process:

```bash
# Terminal 2: Dev server logs
tail -f /tmp/omniops-dev.log

# Terminal 3: Unit test logs
tail -f /tmp/omniops-unit-tests.log

# Terminal 4: E2E test logs
tail -f /tmp/omniops-e2e-tests.log
```

---

## Alternative: Test Individual Components

### Just E2E Tests (Interactive UI)
```bash
npm run test:e2e:watch
```

### Just E2E File Watcher
```bash
# Terminal 1
npm run dev

# Terminal 2 (after dev server ready)
npm run test:e2e:watch-files
```

### Just Unit Tests
```bash
npm run test:watch
```

---

## What Gets Tested Automatically

**Unit Tests:**
- All `*.test.ts` files in `__tests__/`
- Runs on save
- ~1-2 second feedback

**E2E Tests (Critical Journeys):**
- `complete-purchase-flow.spec.ts`
- `landing-page-demo-flow.spec.ts`
- Runs 2 seconds after last file change
- ~10-20 second feedback

---

## Success Indicators

✅ **Tests Pass:**
```
✅ All tests passed!
✅ AI agents can execute workflows successfully
```

❌ **Tests Fail:**
```
❌ E2E tests failed! (8.5s)
❌ Core user journeys are broken - AI agents will fail

💡 Tip: Run with --headed to see what broke:
   npm run test:e2e:headed
```

---

**Created:** 2025-11-10
**Purpose:** Demo automatic testing system for AI agents
