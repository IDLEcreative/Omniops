# Domain-Agnostic Agent Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-05
**Verified For:** v0.1.0
**Dependencies:**
- [Database Schema Reference](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Agent Architecture](../01-ARCHITECTURE/ARCHITECTURE_AGENTS.md)

**Estimated Read Time:** 10 minutes

## Purpose

The Domain-Agnostic Agent ensures the AI assistant adapts to ANY business type without hardcoded assumptions. This is the foundation of the multi-tenant architecture, allowing a single codebase to serve e-commerce stores, restaurants, real estate agencies, healthcare providers, educational institutions, and more.

## Quick Links

- [Agent Class Implementation](../../lib/agents/domain-agnostic-agent/agent-class.ts)
- [System Prompts](../../lib/agents/domain-agnostic-agent/system-prompts.ts)
- [Entity Formatter](../../lib/agents/domain-agnostic-agent/entity-formatter.ts)
- [Test Suite](__tests__/lib/agents/domain-agnostic-agent-business-types.test.ts)

## Table of Contents

- [Overview](#overview)
- [Supported Business Types](#supported-business-types)
- [How It Works](#how-it-works)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Domain-Agnostic Agent is a critical component of the multi-tenant architecture. It:

1. **Detects** the business type from database classification
2. **Adapts** terminology to match the business context
3. **Generates** business-specific system prompts
4. **Formats** entities appropriately for AI responses
5. **Maintains** brand-agnostic operation (no hardcoded company names or product types)

**Key Principle:** The agent should work equally well for a hydraulic pump supplier, a pizza restaurant, a real estate agency, or any other business type.

## Supported Business Types

### E-commerce
**Terminology:**
- Entity: `product` / `products`
- Available: `in stock`
- Unavailable: `out of stock`
- Price: `price`

**Specific Features:**
- Shipping and delivery options
- Return policy information
- SKU references
- Promotions highlighting

**Example Use Case:** Online stores selling physical goods

---

### Restaurant
**Terminology:**
- Entity: `dish` / `dishes` (or `item` / `menu items`)
- Available: `available`
- Unavailable: `unavailable` / `sold out`
- Price: `price`

**Specific Features:**
- Dietary options (vegan, gluten-free)
- Daily specials
- Reservation options
- Hours of operation

**Example Use Case:** Restaurants, cafes, food delivery services

---

### Real Estate
**Terminology:**
- Entity: `property` / `properties`
- Available: `available` / `for sale`
- Unavailable: `sold` / `under contract`
- Price: `asking price` / `listing price`

**Specific Features:**
- Bedrooms, bathrooms, square footage
- Neighborhood information
- Viewing scheduling
- MLS numbers

**Example Use Case:** Real estate agencies, property management companies

---

### Healthcare
**Terminology:**
- Entity: `service` / `services`
- Available: `available`
- Unavailable: `unavailable`
- Price: `cost` / `fee`

**Specific Features:**
- Insurance acceptance
- Provider credentials
- Appointment scheduling
- Specialties
- Sensitive communication tone

**Example Use Case:** Medical practices, clinics, telehealth providers

---

### Education
**Terminology:**
- Entity: `course` / `courses`
- Available: `open for enrollment` / `available`
- Unavailable: `closed` / `full`
- Price: `tuition` / `cost`

**Specific Features:**
- Course prerequisites
- Credit hours
- Instructor information
- Enrollment deadlines
- Learning outcomes

**Example Use Case:** Universities, online learning platforms, training centers

---

### Legal Services
**Terminology:**
- Entity: `service` / `services`
- Available: `available`
- Unavailable: `unavailable`
- Price: `consultation fee` / `fee`

**Specific Features:**
- Practice areas
- Consultation scheduling
- Professional tone
- **Critical:** Avoid giving specific legal advice

**Example Use Case:** Law firms, legal consultants

---

### Automotive
**Terminology:**
- Entity: `vehicle` / `vehicles`
- Available: `available`
- Unavailable: `sold`
- Price: `price`

**Specific Features:**
- Vehicle specifications (make, model, year, mileage)
- Financing options
- Test drive scheduling
- VIN numbers

**Example Use Case:** Car dealerships, auto brokers

---

### General (Fallback)
**Terminology:**
- Entity: `item` / `items`
- Available: `available`
- Unavailable: `unavailable`
- Price: `price`

**Specific Features:**
- Generic business operations
- Contact information
- Professional tone

**Example Use Case:** Service businesses, consultancies, unclassified businesses

---

## How It Works

### 1. Business Classification Detection

The agent loads business classification from the `business_classifications` table:

```typescript
const { data: classification } = await supabase
  .from('business_classifications')
  .select('business_type, entity_terminology, confidence')
  .eq('domain_id', domainId)
  .single();
```

**Database Schema:**
```sql
CREATE TABLE business_classifications (
  id UUID PRIMARY KEY,
  domain_id UUID REFERENCES customer_configs(id),
  business_type VARCHAR(50), -- 'ecommerce', 'restaurant', etc.
  entity_terminology JSONB,  -- Custom terminology object
  confidence DECIMAL(3,2)    -- 0.00 to 1.00
);
```

### 2. Terminology Adaptation

The agent uses business-specific terminology throughout:

```typescript
interface BusinessContext {
  businessType: string;
  terminology: {
    entityName: string;           // 'product', 'course', 'property'
    entityNamePlural: string;     // 'products', 'courses', 'properties'
    availableText: string;        // 'in stock', 'available', 'open'
    unavailableText: string;      // 'out of stock', 'sold', 'closed'
    priceLabel: string;           // 'price', 'tuition', 'asking price'
    searchPrompt: string;         // 'Search products', 'Browse menu'
  };
  confidence: number;
}
```

### 3. System Prompt Generation

The agent generates business-specific system prompts:

```typescript
// E-commerce example
const prompt = getAdaptiveSystemPrompt(businessContext, hasCustomerData);
// Output: "You are a helpful Customer Service Agent for an ecommerce business.
//          When customers ask about products, ALWAYS show what's in stock first..."

// Healthcare example
const prompt = getAdaptiveSystemPrompt(businessContext, hasCustomerData);
// Output: "You are a helpful Customer Service Agent for a healthcare business.
//          Mention accepted insurance plans, be sensitive to health concerns..."
```

### 4. Entity Formatting

The agent formats entities based on business type:

```typescript
// Real estate entities
formatEntitiesForAI([
  {
    name: '123 Main St',
    price: 450000,
    attributes: { bedrooms: 3, bathrooms: 2, square_feet: 1800 }
  }
]);
// Output: "1. **123 Main St**
//          - 3 bedrooms, 2 bathrooms
//          - 1800 sq ft
//          - asking price: $450,000
//          - Status: available"

// Education entities
formatEntitiesForAI([
  {
    name: 'Intro to Computer Science',
    price: 1200,
    attributes: { course_code: 'CS101', instructor: 'Dr. Smith', credit_hours: 3 }
  }
]);
// Output: "1. **Intro to Computer Science**
//          - Course Code: CS101
//          - Instructor: Dr. Smith
//          - Credits: 3
//          - tuition: $1200
//          - Status: open for enrollment"
```

### 5. Context Building

The agent builds complete context for AI responses:

```typescript
const context = agent.buildAdaptiveContext(
  customerContext,
  userQuery,
  searchResults
);

// Includes:
// - System Instructions (business-specific)
// - Customer Context (personalization)
// - User Query (what they asked)
// - Available Entities (formatted results)
// - Task Instructions (what to do)
// - Reminders (terminology consistency)
```

---

## Usage Examples

### Example 1: E-commerce Store

```typescript
import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';

const agent = new DomainAgnosticAgent(supabaseUrl, supabaseKey);

// Initialize for e-commerce domain
await agent.initializeForDomain('ecommerce-store-123');

// Generate system prompt
const systemPrompt = agent.getAdaptiveSystemPrompt(true);
// Contains: "products", "in stock", "shipping", "SKU"

// Format product entities
const products = [
  { name: 'Widget A', price: 29.99, is_available: true, primary_identifier: 'WGT-001' }
];
const formattedProducts = agent.formatEntitiesForAI(products);

// Build complete context
const context = agent.buildAdaptiveContext(
  'Returning customer, VIP tier',
  'Show me your latest widgets',
  products
);
```

### Example 2: Real Estate Agency

```typescript
const agent = new DomainAgnosticAgent(supabaseUrl, supabaseKey);

// Initialize for real estate domain
await agent.initializeForDomain('realty-co-456');

// Generate system prompt
const systemPrompt = agent.getAdaptiveSystemPrompt(false);
// Contains: "properties", "bedrooms", "viewings", "MLS"

// Format property entities
const properties = [
  {
    name: '123 Oak Lane',
    price: 525000,
    is_available: true,
    attributes: {
      bedrooms: 4,
      bathrooms: 2.5,
      square_feet: 2400,
      address: '123 Oak Lane, City, ST 12345'
    }
  }
];
const formattedProperties = agent.formatEntitiesForAI(properties);

// Build context
const context = agent.buildAdaptiveContext(
  'First-time homebuyer, pre-approved for $550K',
  'Show me 4-bedroom homes under $550K',
  properties
);
```

### Example 3: Educational Institution

```typescript
const agent = new DomainAgnosticAgent(supabaseUrl, supabaseKey);

// Initialize for education domain
await agent.initializeForDomain('university-789');

// Generate system prompt
const systemPrompt = agent.getAdaptiveSystemPrompt(false);
// Contains: "courses", "enrollment", "prerequisites", "credits"

// Format course entities
const courses = [
  {
    name: 'Data Structures',
    price: 1500,
    is_available: true,
    attributes: {
      course_code: 'CS201',
      instructor: 'Dr. Johnson',
      credit_hours: 4
    }
  }
];
const formattedCourses = agent.formatEntitiesForAI(courses);

// Build context
const context = agent.buildAdaptiveContext(
  'Sophomore CS major, GPA 3.7',
  'What CS courses are available for next semester?',
  courses
);
```

---

## Testing

### Test Coverage

The domain-agnostic agent has comprehensive test coverage across 4 test suites:

1. **Initialization Tests** (`domain-agnostic-agent-initialization.test.ts`)
   - Business classification loading
   - Default context fallback
   - Multiple business type initialization
   - Error handling for uninitialized agent

2. **Execution Tests** (`domain-agnostic-agent-execution.test.ts`)
   - System prompt generation
   - Query intent detection
   - Customer data personalization
   - Anti-competitor safeguards

3. **Integration Tests** (`domain-agnostic-agent-integration.test.ts`)
   - Entity formatting for different business types
   - Context building
   - Empty result handling

4. **Business Types Tests** (`domain-agnostic-agent-business-types.test.ts`)
   - Education, legal, automotive specific tests
   - Edge cases and error handling
   - Brand-agnostic validation
   - Query intent edge cases
   - Context building edge cases

**Total Tests:** 53 tests across 4 test suites
**Pass Rate:** 100%

### Running Tests

```bash
# Run all domain-agnostic agent tests
npm test -- __tests__/lib/agents/domain-agnostic

# Run specific test suite
npm test -- __tests__/lib/agents/domain-agnostic-agent-initialization.test.ts

# Run with coverage
npm test -- __tests__/lib/agents/domain-agnostic --coverage
```

### Key Test Scenarios

**Business Type Detection:**
- ✅ E-commerce, Restaurant, Real Estate, Healthcare, Education, Legal, Automotive
- ✅ Generic fallback for unclassified businesses
- ✅ Low confidence handling
- ✅ Database error graceful degradation

**Terminology Adaptation:**
- ✅ Correct terms used for each business type
- ✅ Consistent terminology throughout context
- ✅ No cross-contamination between business types

**Entity Formatting:**
- ✅ Business-specific attributes displayed correctly
- ✅ Null/undefined attribute handling
- ✅ Missing price field handling
- ✅ Empty result sets
- ✅ Large result sets (100+ entities)

**Edge Cases:**
- ✅ Empty/null customer context
- ✅ Very long query strings
- ✅ Special characters in queries
- ✅ Non-English characters
- ✅ Malformed entity data
- ✅ Multiple intent queries

**Brand-Agnostic Validation:**
- ✅ No hardcoded company names (Thompson's, Cifa, etc.)
- ✅ No hardcoded product types (pumps, hydraulic parts, etc.)
- ✅ No industry-specific assumptions in generic mode

---

## Best Practices

### 1. Always Initialize Before Use

```typescript
// ❌ WRONG - No initialization
const agent = new DomainAgnosticAgent(url, key);
agent.getAdaptiveSystemPrompt(); // Throws error

// ✅ CORRECT - Initialize first
const agent = new DomainAgnosticAgent(url, key);
await agent.initializeForDomain('domain-id');
agent.getAdaptiveSystemPrompt(); // Works
```

### 2. Use Business-Specific Terminology

```typescript
// ❌ WRONG - Hardcoded terminology
const message = "Here are our products in stock";

// ✅ CORRECT - Use business context
const { terminology } = businessContext;
const message = `Here are our ${terminology.entityNamePlural} that are ${terminology.availableText}`;
```

### 3. Handle Low Confidence Gracefully

```typescript
if (businessContext.confidence < 0.5) {
  // Use generic terminology
  // Consider re-classifying
  // Log for human review
}
```

### 4. Test with Multiple Business Types

Always test new features with at least 3 different business types to ensure true brand-agnostic operation:

```typescript
describe('New Feature', () => {
  const businessTypes = ['ecommerce', 'restaurant', 'real_estate'];

  businessTypes.forEach(type => {
    it(`should work for ${type}`, async () => {
      // Test implementation
    });
  });
});
```

### 5. Never Hardcode Business Assumptions

```typescript
// ❌ WRONG - Assumes e-commerce
if (entity.stock_quantity === 0) {
  return "out of stock";
}

// ✅ CORRECT - Uses business context
if (!entity.is_available) {
  return businessContext.terminology.unavailableText;
}
```

---

## Troubleshooting

### Issue: Agent throws "Must initialize with domain first"

**Cause:** Attempting to use agent methods before calling `initializeForDomain()`

**Solution:**
```typescript
const agent = new DomainAgnosticAgent(url, key);
await agent.initializeForDomain('your-domain-id'); // Must call this first
```

---

### Issue: Wrong terminology appearing in responses

**Cause:** Business classification is incorrect or missing

**Solution:**
1. Check `business_classifications` table for correct `business_type`
2. Verify `entity_terminology` JSON is complete
3. Re-run business classification if needed

```sql
-- Check classification
SELECT * FROM business_classifications WHERE domain_id = 'your-domain-id';

-- Update if needed
UPDATE business_classifications
SET business_type = 'restaurant',
    entity_terminology = '{"entityName": "dish", "entityNamePlural": "dishes", ...}'
WHERE domain_id = 'your-domain-id';
```

---

### Issue: Generic fallback used instead of specific business type

**Cause:** No classification exists in database

**Solution:**
1. Create business classification:

```sql
INSERT INTO business_classifications (domain_id, business_type, entity_terminology, confidence)
VALUES (
  'your-domain-id',
  'ecommerce',
  '{"entityName": "product", "entityNamePlural": "products", "availableText": "in stock", "unavailableText": "out of stock", "priceLabel": "price", "searchPrompt": "Search products"}',
  0.9
);
```

2. Alternatively, the agent will use generic fallback with confidence 0.5

---

### Issue: Hardcoded terms appearing in production

**Cause:** Code contains hardcoded company names or product types

**Solution:**
1. Run brand-agnostic validation tests:
```bash
npm test -- __tests__/lib/agents/domain-agnostic-agent-business-types.test.ts -t "Brand-Agnostic"
```

2. Search codebase for hardcoded terms:
```bash
grep -r "Thompson\|Cifa\|pumps\|hydraulic" lib/agents/
```

3. Replace with configuration-driven values

---

### Issue: Entity attributes not displaying

**Cause:** Attributes object structure doesn't match business type expectations

**Solution:**
Check entity formatter switch statement for your business type and ensure attributes match:

```typescript
// For real estate:
entity.attributes = {
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1800,
  address: '123 Main St'
};

// For education:
entity.attributes = {
  course_code: 'CS101',
  instructor: 'Dr. Smith',
  credit_hours: 3
};
```

---

## Related Documentation

- [Agent Architecture](../01-ARCHITECTURE/ARCHITECTURE_AGENTS.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Multi-Tenant Architecture](../01-ARCHITECTURE/ARCHITECTURE_MULTI_TENANT.md)
- [Testing Guide](../02-GUIDES/GUIDE_TESTING.md)

---

## Changelog

**2025-11-05:** Initial comprehensive guide created
- Documented all 8 supported business types
- Added usage examples for e-commerce, real estate, education
- Included complete testing documentation (53 tests)
- Added troubleshooting section
- Validated against v0.1.0 codebase
