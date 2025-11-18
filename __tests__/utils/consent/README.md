**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Consent Test Utilities

**Purpose:** Reusable test fixtures and mock factories for consent management testing.

**Last Updated:** 2025-11-10
**Status:** Active
**Related:** `__tests__/lib/autonomous/security/consent-manager/`

## Files

### mock-consent-data.ts (115 LOC)

Provides consistent test data fixtures for consent testing:

```typescript
// Basic request fixtures
validConsentRequest: ConsentRequest
invalidEmptyPermissionsRequest: ConsentRequest
consentWithExpiryRequest: ConsentRequest

// Consent record fixtures
mockConsentRecord: ConsentRecord (active, no expiry)
mockExpiredConsentRecord: ConsentRecord (expired)
mockFutureConsentRecord: ConsentRecord (future expiry)
mockConsentList: ConsentRecord[] (multi-service list)
```

**Usage:**
```typescript
import { validConsentRequest, mockConsentRecord } from '__tests__/utils/consent/mock-consent-data';

it('should work', () => {
  const result = await grantConsent(validConsentRequest);
  expect(result).toMatchObject(mockConsentRecord);
});
```

### supabase-mock.ts (29 LOC)

Factory functions for creating mock Supabase clients:

```typescript
// Create a single chainable query
createMockQuery() → MockQuery

// Create complete mock Supabase client
createMockSupabaseClient() → MockSupabaseClient
```

**Usage:**
```typescript
import { createMockSupabaseClient } from '__tests__/utils/consent/supabase-mock';

beforeEach(() => {
  mockSupabaseClient = createMockSupabaseClient();
  consentManager = new ConsentManager(mockSupabaseClient);
});
```

## Quick Integration Guide

### For New Test Files

1. Import shared utilities:
```typescript
import { createMockSupabaseClient } from '__tests__/utils/consent/supabase-mock';
import { mockConsentRecord } from '__tests__/utils/consent/mock-consent-data';
```

2. Set up in beforeEach:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mockSupabaseClient = createMockSupabaseClient();
  // ... initialize your class
});
```

3. Use fixtures in tests:
```typescript
it('should work', async () => {
  mockSomeFunction.mockResolvedValue(mockConsentRecord);
  // ...test assertions
});
```

## Test Data Characteristics

### mockConsentRecord
- Active consent (is_active: true)
- No expiration (expires_at: null)
- WooCommerce service
- read_products, create_api_keys permissions
- Current timestamps

### mockExpiredConsentRecord
- Dates set to 1 year in past
- Simulates expired consent
- Same service/operation structure
- is_active remains true (status is time-based)

### mockFutureConsentRecord
- Expiration 1 year in future
- Active status
- Simulates valid time-bound consent
- Useful for expiry validation tests

## When to Add New Fixtures

Add to `mock-consent-data.ts` when you need:
- New service types (beyond woocommerce, shopify, stripe)
- Special permission combinations
- Edge case timestamps
- Multiple organization scenarios
- User permission variations

**Example:**
```typescript
export const mockGoogleAnalyticsConsent = {
  // ... consent record with google-analytics service
};

export const mockMultiOrgConsentList = [
  // ... consents from different organizations
];
```

## Maintenance

**Keep updated when:**
- ConsentRequest type changes
- Consent record schema changes
- Supabase client API changes
- Mock methods need new capabilities

**Verification:**
```bash
# Ensure all test files can import utilities
npm test -- consent

# Check for unused fixtures
grep -r "mock" __tests__/lib/autonomous/security/consent-manager/
```
