**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Integration Tests

# Multi-Domain Chat Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 6 minutes

**Location:** `__tests__/integration/multi-domain/`
**Related:** `__tests__/utils/domain/multi-domain-test-helpers.ts`

## Purpose

This directory contains focused integration tests for multi-tenant chat functionality. These tests verify that the chat system works correctly across different business domains (restaurants, real estate, healthcare, e-commerce) without brand-specific biases or tenant data leakage.

Originally a single 520 LOC file, this has been refactored into specialized modules following the 300 LOC limit requirement.

## Test Modules

### 1. `domain-isolation.test.ts` (45 LOC)
Tests that different tenant domains are properly isolated and don't interfere with each other.

**Tests:**
- Domain independence (no hardcoded defaults)
- API domain parameter enforcement
- Domain credential isolation

**Validates:**
- Widget doesn't default to specific domain (Thompson's)
- API requires domain parameter in requests
- Credentials are isolated per domain

### 2. `cross-domain-prevention.test.ts` (85 LOC)
Tests that prevent cross-tenant access and data leakage between domains.

**Tests:**
- Brand reference prevention in code
- Equipment terminology prevention
- Customer-specific reference prevention
- Industry-specific assumption prevention

**Validates:**
- No brand-specific references (Thompson, Cifa) in production code
- No equipment terminology (pump, hydraulic) in system prompts
- No industry-specific assumptions hardcoded
- Code is truly brand-agnostic

### 3. `domain-config.test.ts` (95 LOC)
Tests that domain-specific configurations use generic placeholders instead of hardcoded values.

**Tests:**
- Generic placeholder usage in prompts
- No hardcoded SKUs
- Configurable system prompts per domain
- No hardcoded product identifiers

**Validates:**
- Prompts use `[PRODUCT_NAME]`, `[COMPANY_NAME]` placeholders
- No SKUs like 'A4VTG90', 'K2053463' hardcoded
- Configuration is database-driven, not code-driven
- All product references are parameterizable

### 4. `data-separation.test.ts` (120 LOC)
Tests that data is properly segregated between different tenant domains.

**Tests:**
- Cache fairness (no hardcoded domain preloading)
- Search product boosting prevention
- Fair search scoring
- No domain-specific product boosts
- Embeddings isolation per tenant

**Validates:**
- Cache doesn't have hardcoded domain names
- Search doesn't artificially boost specific products
- Search scoring is based on relevance only (no 0.99/1.0 artificial scores)
- Embeddings are keyed per tenant

### 5. `domain-switching.test.ts` (130 LOC)
Tests context switching between different domains.

**Tests:**
- API supports switching between domains
- Widget configuration switches per domain
- Credentials switch when domain context changes
- Session state doesn't leak between domain switches
- Cache invalidation on domain switch

**Validates:**
- Multi-domain requests are properly routed
- Widget loads correct configuration per domain
- WooCommerce credentials are tenant-specific
- Session state is scoped per domain
- Cache is invalidated on domain context changes

### 6. `multi-tenant-workflows.test.ts` (150 LOC)
End-to-end workflows verifying brand-agnostic operation across multiple domains.

**Tests:**
- Restaurant workflow is brand-agnostic
- Real Estate workflow is brand-agnostic
- Healthcare workflow is brand-agnostic
- Full system is brand-agnostic across workflows

**Validates:**
- Each business type works without equipment terminology
- Generic placeholders are used throughout
- SKUs are not hardcoded
- Complete workflows work for any domain

## Shared Utilities

### `__tests__/utils/domain/multi-domain-test-helpers.ts` (220 LOC)

Provides common helper functions used by all test modules:

**Helper Functions:**
- `checkForHardcodedDomain()` - Detect hardcoded domain names in files
- `checkSystemPromptsForBrands()` - Scan prompts for brand terminology
- `checkForProductBoosting()` - Detect product-specific boosting in search
- `checkApiRequiresDomain()` - Verify API enforcement of domain parameter
- `checkCodeForBrandReferences()` - Search for brand names in production code
- `checkCachePreloading()` - Check for hardcoded cache preloading
- `checkPromptsUseGenericPlaceholders()` - Verify generic placeholder usage
- `checkForHardcodedSKUs()` - Detect hardcoded product SKUs
- `checkForArtificialScoring()` - Detect artificial score boosting
- `getBusinessTypeIcon()` - Format console output with emojis
- `createTestResult()` - Initialize test result object
- `finializeTestResult()` - Update result status based on failures

**Data Types:**
```typescript
interface DomainTestResult {
  domain: string;
  businessType: string;
  testsPassed: number;
  testsFailed: number;
  violations: string[];
  status: 'PASS' | 'FAIL';
}
```

## Running Tests

### Run all multi-domain tests:
```bash
npm test -- __tests__/integration/multi-domain
```

### Run specific test module:
```bash
npm test -- __tests__/integration/multi-domain/domain-isolation.test.ts
npm test -- __tests__/integration/multi-domain/cross-domain-prevention.test.ts
npm test -- __tests__/integration/multi-domain/domain-config.test.ts
npm test -- __tests__/integration/multi-domain/data-separation.test.ts
npm test -- __tests__/integration/multi-domain/domain-switching.test.ts
npm test -- __tests__/integration/multi-domain/multi-tenant-workflows.test.ts
```

### Run in watch mode:
```bash
npm test -- __tests__/integration/multi-domain --watch
```

## Test Statistics

- **Total Modules:** 6 test files
- **Total Tests:** 19 test cases
- **Helper Functions:** 13 utility functions
- **Total LOC (refactored):** ~625 LOC
  - Utilities: 220 LOC
  - Modules: ~405 LOC (all <150 LOC each)
  - Original: 520 LOC (single file)
- **Refactoring Gain:** Improved modularity and maintainability

## Coverage Areas

### Multi-Tenancy
- ✅ Domain isolation
- ✅ Cross-domain prevention
- ✅ Data segregation
- ✅ Credential management per tenant
- ✅ Session isolation

### Brand-Agnostic Compliance
- ✅ No hardcoded brand names (Thompson's, Cifa)
- ✅ No equipment terminology (pump, hydraulic)
- ✅ No industry-specific assumptions
- ✅ No product SKU hardcoding
- ✅ Generic placeholder usage

### Configuration Management
- ✅ Dynamic configuration per domain
- ✅ Environment-based URL loading
- ✅ Credential decryption per domain
- ✅ Cache configurability
- ✅ System prompt customization

### Search & Ranking
- ✅ Fair product ranking (no boosting)
- ✅ Relevance-based scoring
- ✅ No artificial score inflation
- ✅ Domain-agnostic search behavior

## Key Test Scenarios

### Scenario 1: Restaurant Domain
Verifies a restaurant can use the system without seeing equipment-related content:
- No "pump" or "hydraulic" terminology
- Generic product placeholders
- Fair search ranking for all products

### Scenario 2: Real Estate Domain
Verifies a real estate business can use the system without equipment references:
- API enforces domain parameter
- No hardcoded brand defaults
- Configurable cache behavior

### Scenario 3: Healthcare Domain
Verifies a healthcare provider can use the system:
- Generic AI prompts
- No product SKUs hardcoded
- Fair search scoring

### Scenario 4: Parallel Multi-Tenant Operations
Verifies multiple domains can coexist:
- Each domain has isolated data
- Switching domains changes context correctly
- No data leakage between tenants
- Session state is per-domain

## Common Failures & Debugging

### Test Failure: "Hardcoded domain fallback detected"
**Cause:** `components/ChatWidget.tsx` contains hardcoded domain name
**Fix:** Use environment variables or dynamic configuration loading

### Test Failure: "Equipment terminology found in system prompts"
**Cause:** System prompts mention "pump", "hydraulic", etc.
**Fix:** Replace with generic placeholders like `[PRODUCT_TYPE]`

### Test Failure: "API doesn't enforce domain parameter"
**Cause:** API routes don't validate domain parameter
**Fix:** Add validation check in route handler

### Test Failure: "Hardcoded SKUs detected"
**Cause:** Product SKUs are hardcoded in prompts
**Fix:** Use placeholder variables instead (e.g., `[PRODUCT_SKU]`)

### Test Failure: "Product boosting detected"
**Cause:** Search algorithm artificially boosts specific products
**Fix:** Remove hardcoded product identifiers and scoring bias

## Integration with Main Test Suite

The orchestrator file `__tests__/integration/test-multi-domain-chat.ts` imports all modules:

```typescript
import './multi-domain/domain-isolation.test';
import './multi-domain/cross-domain-prevention.test';
import './multi-domain/domain-config.test';
import './multi-domain/data-separation.test';
import './multi-domain/domain-switching.test';
import './multi-domain/multi-tenant-workflows.test';
```

This allows running all multi-domain tests with:
```bash
npm test -- __tests__/integration/test-multi-domain-chat.ts
```

## Maintenance Guidelines

### Adding New Domain Tests
1. Create new file in this directory: `feature-name.test.ts`
2. Import shared helpers from `multi-domain-test-helpers.ts`
3. Keep file under 300 LOC
4. Add test case to appropriate describe block
5. Import in orchestrator if it's a major feature

### Updating Helper Functions
1. Edit `__tests__/utils/domain/multi-domain-test-helpers.ts`
2. Run all tests to verify no regressions
3. Update this README with any new functions

### Handling New Brands/Products
When a new customer is added (e.g., selling "widgets"):
1. Add to test data in helper functions
2. Run tests to ensure brand-agnostic checks pass
3. If test fails, fix underlying code before deployment

## Related Documentation

- **Architecture:** See `docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md` for multi-tenant design
- **Testing Guide:** See `docs/TESTING.md` for overall test strategy
- **Brand-Agnostic Requirements:** See `CLAUDE.md` for multi-tenant rules
- **Integration Tests:** See `__tests__/integration/README.md` for other integration tests

## Performance Notes

- **Typical Run Time:** ~6-10 seconds for all 6 modules (Jest parallel)
- **Timeout:** 30 seconds per test (file I/O intensive)
- **I/O Operations:** Each test reads multiple production files via grep/fs
- **Optimization:** Helpers cache file reads where possible

## Example Test Output

```
✓ domain-isolation.test.ts
  Domain Isolation Tests (45 LOC)
  ✓ should isolate restaurant domain without hardcoded defaults (200ms)
  ✓ should enforce domain parameter in API requests (180ms)
  ✓ should isolate healthcare domain credentials (190ms)

✓ cross-domain-prevention.test.ts
  Cross-Domain Prevention Tests (85 LOC)
  ✓ should not contain brand-specific references in production code (500ms)
  ✓ should not contain equipment terminology in system prompts (450ms)
  ✓ should not reference specific customers in code (480ms)
  ✓ should not contain industry-specific assumptions (470ms)

✓ domain-config.test.ts
  Domain Configuration Tests (95 LOC)
  ✓ should use generic placeholders in AI prompts (400ms)
  ✓ should not contain hardcoded SKUs in prompts (420ms)
  ✓ should support configurable system prompts per domain (380ms)
  ✓ should not contain hardcoded product identifiers (410ms)

✓ data-separation.test.ts
  Data Separation Tests (120 LOC)
  ✓ should not preload cache for specific domains (350ms)
  ✓ should not boost specific products in search results (480ms)
  ✓ should use fair search scoring based on relevance (470ms)
  ✓ should not apply domain-specific product boosts (460ms)
  ✓ should isolate embeddings per tenant (320ms)

✓ domain-switching.test.ts
  Domain Switching Tests (130 LOC)
  ✓ should support switching between different domains (200ms)
  ✓ should configure widget dynamically per domain (220ms)
  ✓ should switch credentials when domain context changes (210ms)
  ✓ should isolate session state between domain switches (190ms)
  ✓ should properly invalidate cache when switching domains (240ms)

✓ multi-tenant-workflows.test.ts
  Multi-Tenant Workflows Tests (150 LOC)
  ✓ should handle restaurant domain workflows without brand bias (600ms)
  ✓ should handle real estate domain workflows without brand bias (580ms)
  ✓ should handle healthcare domain workflows without brand bias (590ms)
  ✓ should maintain brand-agnostic operation across all workflows (700ms)

Tests: 19 passed, 0 failed
Time: 8.2s
```
