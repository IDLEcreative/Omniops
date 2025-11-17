# Multi-Turn Conversation E2E Tests

**Type:** E2E Integration Tests
**Status:** Requires Running Dev Server
**File:** `multi-turn-conversation-e2e-agent-tests.test.ts`
**Last Updated:** 2025-11-17

## Purpose

These tests validate multi-turn conversation functionality by making real HTTP requests to the `/api/chat` endpoint. They test:

- **Test 14:** Agent state persistence across conversation turns
- **Test 15:** Concurrent conversation isolation (CRITICAL for multi-tenancy)
- **Test 16:** Context loss recovery mechanisms
- **Test 17:** Extremely long conversation handling (20+ turns)

## Why These Tests Are Skipped in Jest

These tests are **intentionally excluded** from the normal Jest test suite (see `jest.config.js` line 95) because they:

1. **Require a running dev server** on port 3000
2. **Make real HTTP requests** via `fetch('http://localhost:3000/api/chat')`
3. **Take 60-240 seconds** to complete (too slow for pre-push hooks)
4. **Need real AI API calls** (OpenAI, Supabase)

Including them in normal test runs would cause:
- ❌ Test failures when dev server isn't running
- ❌ Extremely slow CI/CD pipelines
- ❌ Flaky tests due to network/timing issues

## How to Run These Tests

### Option 1: Manual Run (Recommended for Development)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run the E2E tests
npm test -- __tests__/integration/multi-turn-conversation-e2e-agent-tests.test.ts --testPathIgnorePatterns=""
```

### Option 2: Automated E2E Test Suite

```bash
# Run all E2E tests including this one
npm run test:e2e:integration
```

*(Note: This script needs to be added to `package.json` if it doesn't exist)*

### Option 3: CI/CD Pipeline

These tests should run in a dedicated E2E test stage that:
1. Starts the Next.js dev server
2. Waits for server to be ready
3. Runs E2E tests
4. Shuts down server

Example GitHub Actions workflow:

```yaml
- name: Run E2E Integration Tests
  run: |
    npm run dev &
    SERVER_PID=$!
    npx wait-on http://localhost:3000
    npm test -- __tests__/integration/multi-turn-conversation-e2e-agent-tests.test.ts --testPathIgnorePatterns=""
    kill $SERVER_PID
```

## Alternative: Convert to Direct Route Handler Tests

If you need these tests to run as part of normal Jest suite, they should be refactored to:

1. **Import the route handler directly:**
   ```typescript
   import { POST } from '@/app/api/chat/route';
   ```

2. **Call it with mocked dependencies:**
   ```typescript
   const mockRequest = new NextRequest('http://localhost:3000/api/chat', {
     method: 'POST',
     body: JSON.stringify({ message: 'test', session_id: 'test', domain: 'example.com' })
   });
   const response = await POST(mockRequest, { params: Promise.resolve({}), deps: mockDeps });
   ```

3. **Mock external services:** OpenAI, Supabase, etc.

However, this loses the value of true E2E testing where all components integrate naturally.

## Test Requirements

- **Environment Variables:** All Supabase and OpenAI keys must be set
- **Dev Server:** Must be running on port 3000
- **Network Access:** Tests make real API calls
- **Execution Time:** 60-240 seconds per test
- **Database:** Supabase instance must be accessible

## Current Status

✅ Tests are properly excluded from Jest suite
✅ Tests work correctly when dev server is running
⚠️  No automated E2E test runner configured yet
⚠️  Not part of CI/CD pipeline

## Related Files

- Test file: `__tests__/integration/multi-turn-conversation-e2e-agent-tests.test.ts`
- Jest config: `jest.config.js` (line 95)
- Chat route: `app/api/chat/route.ts`
- Response handler: `lib/chat/response-handler.ts`

## Troubleshooting

### Tests fail with "conversation_id is undefined"

**Cause:** MSW (Mock Service Worker) is intercepting requests
**Solution:** Tests now properly disable MSW in `beforeAll()` hook

### Tests fail with "ECONNREFUSED"

**Cause:** Dev server not running or on wrong port
**Solution:** Ensure `npm run dev` is running on port 3000

### Tests timeout or hang

**Cause:** OpenAI API slowness or rate limiting
**Solution:** Increase test timeout or mock OpenAI responses

## Future Improvements

1. **Add E2E test runner script** to `package.json`
2. **Add to CI/CD pipeline** as separate stage
3. **Consider Playwright** for more robust E2E testing with automatic server management
4. **Add test data fixtures** to make tests more predictable
