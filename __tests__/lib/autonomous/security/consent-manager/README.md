**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# ConsentManager Test Suite

**Purpose:** Modular test suite for the ConsentManager class with focused test files organized by functionality.

**Last Updated:** 2025-11-10
**Status:** Active
**Related:** `/lib/autonomous/security/consent-manager.ts`

## Test Files

| File | LOC | Coverage |
|------|-----|----------|
| `grant.test.ts` | 96 | Consent granting, validation, expiry |
| `verify.test.ts` | 65 | Consent verification, expiry checks |
| `revoke.test.ts` | 67 | Revocation by service/operation and ID |
| `list-and-query.test.ts` | 105 | Listing, filtering, getById operations |
| `permissions-and-stats.test.ts` | 199 | Permissions, stats, bulk revocation |
| `index.test.ts` | 19 | Test suite orchestrator |

**Total Test Code:** 551 LOC (excluding helpers)

## Test Organization

Each test file focuses on a specific ConsentManager capability:

### grant.test.ts
- Successful consent granting
- Permission validation (require non-empty)
- Expiration date support
- Error handling

### verify.test.ts
- Active consent verification
- Non-existent consent handling
- Expired consent detection
- Future expiration validation

### revoke.test.ts
- Consent revocation by service/operation
- Consent revocation by ID
- Error handling

### list-and-query.test.ts
- List all consents for organization
- Filter by active status
- Filter by service
- Retrieve consent by ID
- Handle non-existent records

### permissions-and-stats.test.ts
- Check if user has specific permission
- Permission existence validation
- Extend consent expiration
- Calculate consent statistics
- Bulk revoke for service

## Shared Test Utilities

Located in `__tests__/utils/consent/`:

### mock-consent-data.ts
- `validConsentRequest` - Standard consent request
- `invalidEmptyPermissionsRequest` - Validation test fixture
- `consentWithExpiryRequest` - Expiration test fixture
- `mockConsentRecord` - Active consent record
- `mockExpiredConsentRecord` - Expired consent fixture
- `mockFutureConsentRecord` - Future expiry fixture
- `mockConsentList` - Multi-service consent list

### supabase-mock.ts
- `createMockQuery()` - Chainable Supabase query builder
- `createMockSupabaseClient()` - Complete mock client

## Running Tests

```bash
# Run all consent tests
npm test -- consent-manager

# Run specific test file
npm test -- grant.test.ts

# Run with coverage
npm test -- --coverage __tests__/lib/autonomous/security/consent-manager/
```

## Refactoring Rationale

Original file: `consent-manager.test.ts` (563 LOC)

**Benefits of modular approach:**
- Each test file focuses on one capability (SRP)
- Easier to locate and modify specific tests
- Reduced cognitive load per file
- Clear test organization by feature
- Shared utilities minimize duplication
- All files under 300 LOC limit

**Organization Pattern:**
```
Helpers (__tests__/utils/consent/)
    ↓
Focused Tests (consent-manager/)
    ├── grant.test.ts
    ├── verify.test.ts
    ├── revoke.test.ts
    ├── list-and-query.test.ts
    └── permissions-and-stats.test.ts
    ↓
Orchestrator (index.test.ts)
```
