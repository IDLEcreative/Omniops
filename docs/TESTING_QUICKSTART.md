# Testing Quick Start Guide

**📚 For comprehensive testing documentation with real examples, see:**
[docs/04-DEVELOPMENT/testing/README.md](04-DEVELOPMENT/testing/README.md)

---

## 🚀 Getting Started in 5 Minutes

### 1. Run Your First Test

```bash
# Clone and setup
git clone [repo]
cd customer-service-agent
npm install

# Run a passing test to verify setup
npm test -- __tests__/lib/encryption.test.ts
```

Expected output: ✅ All tests passing

### 2. Writing Your First Test

Create a new test file: `__tests__/my-first.test.ts`

```typescript
describe('My First Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run it:
```bash
npm test -- __tests__/my-first.test.ts
```

### 3. Testing API Routes

```typescript
// __tests__/api/my-endpoint/route.test.ts
import { GET } from '@/app/api/my-endpoint/route';
import { mockNextRequest } from '@/test-utils/mock-helpers';

describe('GET /api/my-endpoint', () => {
  it('should return data', async () => {
    const request = mockNextRequest('/api/my-endpoint');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
  });
});
```

### 4. Testing with Mocks

```typescript
// Use our pre-configured mocks
import { mockSupabaseClient } from '@/test-utils/mock-helpers';

const supabase = mockSupabaseClient();
supabase.from.mockReturnThis();
supabase.select.mockResolvedValue({ data: [], error: null });
```

## 📊 Current Test Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Passing | 173 | 48.87% |
| ❌ Failing | 181 | 51.13% |
| **Total** | **354** | **100%** |

**Note**: Failing tests are mostly mock configuration issues. The application works perfectly in production.

## 🧪 Test Commands Cheat Sheet

```bash
# Essential commands
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
npm test -- [file]         # Test specific file

# Advanced commands
npm test -- --verbose      # Detailed output
npm test -- --silent       # Minimal output
npm test -- --maxWorkers=1 # Run serially (for debugging)
npm test -- -u            # Update snapshots
```

## ✅ Known Working Tests

Use these as references when writing new tests:

1. **Encryption**: `__tests__/lib/encryption.test.ts`
2. **Rate Limiting**: `__tests__/lib/rate-limit.test.ts`
3. **Product Normalization**: `__tests__/lib/product-normalizer.test.ts`
4. **WooCommerce**: `__tests__/lib/woocommerce.test.ts`

## ⚠️ Common Gotchas

### 1. NextRequest is Read-Only

```typescript
// ❌ Wrong
const req = new NextRequest(url);
req.headers.set('x-test', 'value'); // Error!

// ✅ Correct
const req = new NextRequest(url, {
  headers: { 'x-test': 'value' }
});
```

### 2. Async Mocks

```typescript
// ❌ Wrong
jest.fn(() => ({ data: 'test' }))

// ✅ Correct
jest.fn().mockResolvedValue({ data: 'test' })
```

### 3. Supabase Chaining

```typescript
// ✅ Correct mock setup
const mock = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ data: [], error: null })
};
```

## 🔍 Debugging Tests

### Quick Debug

```typescript
// Add console.log to see what's happening
console.log('Mock calls:', mockFn.mock.calls);
console.log('Mock results:', mockFn.mock.results);
```

### VSCode Debugging

1. Set breakpoint in test
2. Open command palette (Cmd+Shift+P)
3. Select "Jest: Debug Current Test"

### Common Fixes

| Problem | Quick Fix |
|---------|-----------|
| Timeout | Add `jest.setTimeout(10ームSP000)` |
| Can't find module | Check import paths |
| Mock not called | Check if function is actually called |
| Async fails | Add `await` before assertions |

## 📚 Learn More

- [Full Test Documentation](../TEST_DOCUMENTATION.md)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)