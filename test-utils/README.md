**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Test Utils Directory

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Jest, Mock Service Worker (MSW)
**Estimated Read Time:** 3 minutes

## Purpose

Testing utilities, Jest setup files, and Mock Service Worker (MSW) configuration for browser/React tests and Node.js environment tests.

## Quick Links

- [Testing Guide](/home/user/Omniops/docs/04-DEVELOPMENT/testing/TESTING_GUIDE.md)
- [Test Suite Overview](/home/user/Omniops/__tests__/README.md)
- [MSW Mocks](/home/user/Omniops/__tests__/mocks/README.md)

## Keywords

**Search Terms:** test utilities, Jest setup, MSW, Mock Service Worker, test configuration, environment mocks, testing helpers

**Aliases:**
- "Test setup" (Jest configuration)
- "MSW setup" (API mocking)
- "Test helpers" (utilities)
- "Test environment" (configuration)

---

Testing utilities and setup files for the Customer Service Agent application.

## Structure

```
test-utils/
├── jest.setup.js       # Main Jest setup (DOM environment)
├── jest.setup.msw.js   # Mock Service Worker setup
└── jest.setup.node.js  # Node environment Jest setup
```

## Files

### jest.setup.js
Main Jest setup file for browser/React tests:
- Imports testing library extensions
- Sets up MSW (Mock Service Worker)
- Mocks environment variables
- Mocks Next.js router
- Configures test lifecycle hooks

### jest.setup.msw.js
Mock Service Worker polyfills and configuration:
- Required for intercepting API calls in tests
- Sets up request mocking infrastructure

### jest.setup.node.js
Jest setup for Node.js environment tests:
- Configuration for server-side tests
- API route testing setup
- Node-specific mocks

## Usage

These files are automatically loaded by Jest based on the configuration in:
- `jest.config.js` - For browser/React tests
- `jest.config.node.js` - For Node.js tests

## Environment Variables

Test environment variables are mocked in `jest.setup.js`:
```javascript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
// ... etc
```

## MSW (Mock Service Worker)

MSW is configured to intercept and mock API calls during tests:
- Handlers are defined in `__tests__/mocks/handlers.ts`
- Server instance is in `__tests__/mocks/server.ts`

## Adding New Test Utilities

Place new test utilities in this directory:
```javascript
// test-utils/render-with-providers.tsx
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <Providers>{ui}</Providers>
  );
}
```

Then import in your tests:
```javascript
import { renderWithProviders } from '@/test-utils/render-with-providers'
```

## Best Practices

1. Keep setup files focused and minimal
2. Mock external dependencies consistently
3. Use MSW for API mocking instead of manual mocks
4. Reset state between tests to prevent interference
5. Document any complex test utilities