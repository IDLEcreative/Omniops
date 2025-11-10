# Authentication Setup for E2E Tests

This guide explains how authentication works for Playwright E2E tests, specifically for analytics export tests that require dashboard access.

## Overview

Analytics export tests require authentication because they access protected dashboard routes. We use Playwright's authentication state feature to authenticate once and reuse the session across all tests.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     E2E Test Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Global Setup (auth.setup.ts)                                 │
│     ├─ Create test user (if not exists)                          │
│     ├─ Navigate to /login                                        │
│     ├─ Enter credentials                                         │
│     ├─ Submit login form                                         │
│     ├─ Wait for redirect to /dashboard                           │
│     └─ Save auth state → playwright/.auth/user.json              │
│                                                                   │
│  2. Test Execution (analytics-exports/*.spec.ts)                 │
│     ├─ Load saved auth state (automatic via config)              │
│     ├─ Navigate to /dashboard/analytics                          │
│     ├─ Already authenticated ✓                                   │
│     └─ Run test assertions                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Files Created

### 1. Authentication Helpers
**File:** `__tests__/utils/playwright/auth-helpers.ts`

Provides reusable authentication functions:
- `authenticateUser()` - Logs in user via UI
- `saveAuthState()` - Saves session to file
- `isAuthenticated()` - Checks if user is logged in
- `signOut()` - Logs out user
- `setupAuthentication()` - Complete auth setup flow

### 2. Global Setup
**File:** `__tests__/playwright/setup/auth.setup.ts`

Runs before all tests to establish authentication:
- Authenticates test user
- Saves auth state to `playwright/.auth/user.json`
- Executed via `--project=setup` dependency

### 3. Test User Setup Script
**File:** `scripts/tests/setup-test-user.ts`

Creates test user in Supabase database:
- Creates auth user with email confirmation
- Sets up customer configuration
- Updates password if user exists

### 4. Environment Configuration
**File:** `.env.test`

Stores test credentials:
```env
TEST_USER_EMAIL=test@omniops.test
TEST_USER_PASSWORD=test_password_123_secure
BASE_URL=http://localhost:3000
```

### 5. Playwright Configuration
**File:** `playwright.config.js` (updated)

Added setup project and authentication state:
```javascript
projects: [
  // Setup project - runs authentication
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts/,
  },

  // Main tests - use saved auth state
  {
    name: 'chromium',
    use: {
      storageState: 'playwright/.auth/user.json',
    },
    dependencies: ['setup'],
  },
  // ... other browsers
]
```

## Setup Instructions

### One-Time Setup (Required Before First Run)

#### Step 1: Create Test User in Database

```bash
# Create test user in Supabase
npx tsx scripts/tests/setup-test-user.ts

# Verify user was created
npx tsx scripts/tests/setup-test-user.ts verify
```

Expected output:
```
=== Test User Setup ===
📝 Creating test user: test@omniops.test
✅ Test user created successfully
   User ID: 12345678-1234-1234-1234-123456789012
   Email: test@omniops.test
   Email confirmed: Yes
✅ Customer configuration created
```

#### Step 2: Configure Test Credentials

Ensure `.env.test` exists with correct credentials:
```bash
cat .env.test
```

Should contain:
```env
TEST_USER_EMAIL=test@omniops.test
TEST_USER_PASSWORD=test_password_123_secure
BASE_URL=http://localhost:3000
```

#### Step 3: Run Authentication Setup

```bash
# Run auth setup (creates auth state file)
npx playwright test --project=setup

# Verify auth state file was created
ls -la playwright/.auth/user.json
```

Expected output:
```
=== Global Authentication Setup ===
🔐 Setting up authentication for E2E tests...
📁 Created auth directory: playwright/.auth
📍 Entering credentials
📍 Submitting login form
📍 Waiting for authentication to complete
✅ User authenticated successfully
💾 Saving authentication state to: playwright/.auth/user.json
✅ Auth state saved (1234 bytes)
✅ Authentication setup complete
```

### Running Tests with Authentication

Once setup is complete, tests automatically use saved authentication:

```bash
# Run all analytics export tests (authenticated)
npx playwright test analytics-exports

# Run specific test file
npx playwright test csv-export.spec.ts

# Run with UI mode (see auth state being used)
npx playwright test analytics-exports --ui

# Run in headed mode (see browser)
npx playwright test analytics-exports --headed
```

### Troubleshooting

#### Problem: Tests fail with "Not authenticated"

**Symptom:**
```
Error: Not authenticated - redirected to login page
```

**Solution:**
```bash
# Re-run auth setup
npx playwright test --project=setup

# Verify auth state file exists
ls -la playwright/.auth/user.json
```

#### Problem: Auth setup fails with "Invalid credentials"

**Symptom:**
```
❌ Authentication failed: Invalid login credentials
```

**Solutions:**
1. Verify test user exists:
   ```bash
   npx tsx scripts/tests/setup-test-user.ts verify
   ```

2. Recreate test user:
   ```bash
   npx tsx scripts/tests/setup-test-user.ts delete
   npx tsx scripts/tests/setup-test-user.ts
   ```

3. Check credentials in `.env.test` match database

#### Problem: Auth state expired (401 errors)

**Symptom:**
```
API request failed with 401 Unauthorized
```

**Solution:**
```bash
# Auth state expires after ~7 days, regenerate:
npx playwright test --project=setup
```

#### Problem: Test user doesn't exist in database

**Symptom:**
```
❌ Failed to create auth user: User already exists
```

**Solution:**
```bash
# Delete and recreate test user
npx tsx scripts/tests/setup-test-user.ts delete
npx tsx scripts/tests/setup-test-user.ts
```

### CI/CD Configuration

For GitHub Actions or CI/CD pipelines:

```yaml
# .github/workflows/e2e-tests.yml
steps:
  - name: Setup test user
    run: npx tsx scripts/tests/setup-test-user.ts
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
      TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
      TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

  - name: Run E2E tests
    run: npx playwright test
    env:
      BASE_URL: http://localhost:3000
```

### Security Notes

1. **Test credentials are NOT production credentials**
   - Test user: `test@omniops.test`
   - Production users: Real email addresses

2. **Auth state file is gitignored**
   - Contains session tokens
   - Added to `.gitignore`: `playwright/.auth/`

3. **Test user has limited permissions**
   - Only has access to test data
   - Should not have production data access

4. **CI/CD secrets**
   - Store test credentials in GitHub Secrets
   - Never commit credentials to repository

## Test Coverage

### Analytics Export Tests (19 tests)

With authentication, these tests can now execute:

1. **CSV Export Tests** (3 tests)
   - Export analytics as CSV
   - Verify CSV file structure
   - Test 30-day range exports

2. **PDF Export Tests** (3 tests)
   - Export as PDF
   - Export as Excel
   - Verify file naming conventions

3. **Data Validation Tests** (4 tests)
   - Verify JSON data structure
   - Test filtered exports
   - Validate CSV data accuracy
   - Test API response formats

4. **Error Handling Tests** (5 tests)
   - Invalid format requests
   - Missing parameters
   - Unauthorized access
   - Network failures
   - Export timeout handling

5. **Download Flows Tests** (4 tests)
   - Complete download workflow
   - Performance benchmarks
   - Concurrent downloads
   - Large dataset exports

**Total:** 19 authenticated analytics export tests

## Maintenance

### Updating Test User Password

```bash
# Update password in database
npx tsx scripts/tests/setup-test-user.ts

# Update .env.test file
nano .env.test

# Regenerate auth state
npx playwright test --project=setup
```

### Cleaning Up Test User

```bash
# Delete test user from database
npx tsx scripts/tests/setup-test-user.ts delete

# Remove auth state file
rm playwright/.auth/user.json
```

### Resetting Auth State

```bash
# Clear all auth state
rm -rf playwright/.auth/

# Regenerate
npx playwright test --project=setup
```

## Additional Resources

- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [E2E Testing Best Practices](../../../docs/02-GUIDES/GUIDE_E2E_TESTING.md)

## Quick Reference

```bash
# Setup (one-time)
npx tsx scripts/tests/setup-test-user.ts
npx playwright test --project=setup

# Run tests
npx playwright test analytics-exports

# Troubleshoot
npx tsx scripts/tests/setup-test-user.ts verify
npx playwright test --project=setup --debug

# Cleanup
npx tsx scripts/tests/setup-test-user.ts delete
rm -rf playwright/.auth/
```
