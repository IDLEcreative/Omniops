# Domain-Agnostic Agent Business Types Tests

**Purpose:** Comprehensive test suite for multi-tenant business type support in the domain-agnostic agent system. Ensures the system works equally well for e-commerce, education, legal, automotive, and any other business type.

**Type:** Test Suite
**Status:** Active
**Last Updated:** 2025-11-08
**Related:**
- [DomainAgnosticAgent Implementation](/lib/agents/domain-agnostic-agent.ts)
- [Test Helpers](/__tests__/utils/domain-agnostic-test-helpers.ts)
- [Agent Tests Directory](../)

## Test Coverage

**Total Test Modules:** 9 test files
**Total LOC:** 1,160 lines (refactored from original 709 LOC monolithic file)
**All modules:** < 200 LOC (compliance: ✅)

### Test Modules

| Module | LOC | Purpose |
|--------|-----|---------|
| `education-sector.test.ts` | 124 | Education business (courses, tuition, enrollment) |
| `legal-sector.test.ts` | 103 | Legal services (consultations, professional tone) |
| `automotive-sector.test.ts` | 82 | Automotive business (vehicles, VIN, test drives) |
| `cross-industry-comparison.test.ts` | 90 | Multi-tenant terminology isolation |
| `edge-cases-data.test.ts` | 175 | Null values, malformed data handling |
| `edge-cases-system.test.ts` | 164 | Confidence scores, database errors, result sets |
| `query-intent.test.ts` | 116 | Multi-intent, special characters, unicode |
| `context-building.test.ts` | 157 | Adaptive context with search results |
| `brand-agnostic-validation.test.ts` | 149 | Multi-tenant compliance (CRITICAL) |

### Shared Test Utilities

**Location:** `/Users/jamesguy/Omniops/__tests__/utils/domain-agnostic-test-helpers.ts` (134 LOC)

**Exports:**
- `createMockSupabaseClient()` - Mock Supabase for testing
- `mockBusinessTypeConfig()` - Configure business type responses
- `initializeAgentWithBusinessType()` - Initialize agent helper
- `STANDARD_TERMINOLOGY` - Presets for common business types
- `createSampleEntity()` - Entity data factory

## Key Test Categories

### 1. Business Type Support
Tests for specific industry verticals:
- **Education:** Courses, enrollment, tuition, credit hours
- **Legal:** Services, consultations, professional tone, legal disclaimers
- **Automotive:** Vehicles, VIN, financing, test drives
- **E-commerce:** Products, prices, stock availability
- **General:** Fallback for unknown business types

### 2. Multi-Tenant Compliance (CRITICAL)
- **No hardcoded company names** (Thompson's, Amazon, etc.)
- **No industry-specific terms in production code** (pumps, hydraulic, etc.)
- **Terminology from database configuration only**
- **Business type isolation** (education agent doesn't use "products")

### 3. Edge Cases & Error Handling
- Null/undefined values in entities
- Missing required fields (price, name)
- Empty/malformed data
- Database connection errors
- Very low/high confidence scores
- Large result sets (100+ entities)
- Empty search results

### 4. Query Processing
- Multi-intent queries
- Empty/whitespace queries
- Very long queries (100+ words)
- Special characters (@, #, $)
- Unicode/emoji support
- Case sensitivity

### 5. Context Building
- Customer profile adaptation
- Search result formatting
- Entity count display
- Terminology consistency
- Large result handling

## Running Tests

```bash
# Run all business type tests
npm test __tests__/lib/agents/business-types/

# Run specific sector tests
npm test education-sector
npm test legal-sector
npm test automotive-sector

# Run edge cases
npm test edge-cases-data
npm test edge-cases-system

# Run brand-agnostic validation (CRITICAL)
npm test brand-agnostic-validation

# Run with coverage
npm test -- --coverage __tests__/lib/agents/business-types/
```

## Critical Test Assertions

### Brand-Agnostic Validation
```typescript
// ✅ MUST PASS: No hardcoded company names
expect(prompt).not.toContain('Thompson');
expect(prompt).not.toContain('Cifa');
expect(prompt).not.toContain('Amazon');

// ✅ MUST PASS: No industry-specific product types
expect(prompt).not.toContain('pumps');
expect(prompt).not.toContain('hydraulic');
expect(prompt).not.toContain('parts');

// ✅ MUST PASS: Only configured terminology
expect(prompt).toContain('courses'); // For education
expect(prompt).not.toContain('products'); // For education
```

### Business Type Isolation
```typescript
// ✅ Different agents use different terminology
expect(ecommercePrompt).toContain('products');
expect(educationPrompt).toContain('courses');
expect(legalPrompt).toContain('services');
expect(automotivePrompt).toContain('vehicles');
```

## Test Helper Usage

```typescript
import {
  createMockSupabaseClient,
  initializeAgentWithBusinessType,
  STANDARD_TERMINOLOGY,
  createSampleEntity
} from '@/__tests__/utils/domain-agnostic-test-helpers';

// Setup
const mockSupabase = createMockSupabaseClient();
const agent = new DomainAgnosticAgent('url', 'key');

// Initialize with business type
await initializeAgentWithBusinessType(
  agent,
  mockSupabase,
  'education',
  STANDARD_TERMINOLOGY.education,
  0.9 // confidence
);

// Create test data
const entity = createSampleEntity('Course Name', 1200, true, {
  course_code: 'CS101',
  instructor: 'Dr. Smith'
});
```

## Troubleshooting

### Test Failures: Brand-Agnostic Validation
**Symptom:** Tests fail with "should not contain hardcoded company names"

**Fix:**
1. Check `/lib/agents/domain-agnostic-agent.ts`
2. Remove any hardcoded business terms
3. Use `this.terminology` instead of hardcoded strings
4. Ensure all prompts pull from database config

### Test Failures: Business Type Isolation
**Symptom:** Education agent uses "products" terminology

**Fix:**
1. Verify `entity_terminology` in database
2. Check prompt generation logic
3. Ensure terminology is not overridden in code

### Mock Not Working
**Symptom:** `jest.mock('@supabase/supabase-js')` not intercepting calls

**Fix:**
1. Ensure mock is at top of file (before imports)
2. Clear mocks in `beforeEach()`
3. Verify `mockSupabase.from` is properly configured

## Contributing

When adding new business types:

1. **Add test module** in this directory (<200 LOC)
2. **Add terminology preset** to `STANDARD_TERMINOLOGY` in helpers
3. **Add brand-agnostic validation** for new type
4. **Update this README** with new module

## Historical Context

**Refactored:** 2025-11-08
**Original File:** `domain-agnostic-agent-business-types.test.ts` (709 LOC)
**Reason:** Exceeded 300 LOC limit, hard to navigate, poor test isolation
**Result:** 9 focused test modules, improved maintainability, clearer test organization

**Refactoring Benefits:**
- 63% reduction in file size (709 → avg 129 LOC per file)
- Better test isolation and independence
- Easier to locate specific test scenarios
- Parallel test execution potential
- Clearer test failure messages
