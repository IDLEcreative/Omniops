# Brand-Agnostic Implementation Checklist

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 35 minutes

## Purpose
Every line of code must work equally well for:

## Quick Links
- [🚨 CRITICAL REMINDER](#-critical-reminder)
- [1. Code Review Checklist](#1-code-review-checklist)
- [2. Database Schema Rules](#2-database-schema-rules)
- [3. API Endpoint Rules](#3-api-endpoint-rules)
- [4. Testing Requirements](#4-testing-requirements)

## Keywords
agnostic, architectural, brand, changes, checklist, code, common, configuration, critical, database

---


## 🚨 CRITICAL REMINDER

**THIS IS A MULTI-TENANT, BRAND-AGNOSTIC SYSTEM**

Every line of code must work equally well for:
- E-commerce stores (any product type)
- Restaurants and food services
- Real estate and housing
- Healthcare providers
- Educational institutions
- Service businesses
- ANY other business type

**Hardcoding specific information will break the system for other tenants and violate the multi-tenant architecture.**

---

## 1. Code Review Checklist

### General Brand Neutrality
- [ ] No hardcoded company names (e.g., "Acme Corp", "XYZ Industries")
- [ ] No hardcoded logos, brand colors, or visual identity elements
- [ ] No product-specific terminology (e.g., "pumps", "parts", "concrete", "shoes")
- [ ] No industry-specific jargon (e.g., "SKU" only for retail, "menu items" only for restaurants)
- [ ] No business-type assumptions (e.g., assuming all customers have "products" vs "services")
- [ ] No domain names or company-specific URLs in code
- [ ] No company-specific email addresses or contact info
- [ ] All business data comes from `customer_configs` table, NOT from code

### UI and Messaging
- [ ] All user-facing text is configurable or generic
- [ ] Button labels don't assume business type ("View Items" not "View Products")
- [ ] Form fields are industry-neutral ("Name", "Description", not "Part Number")
- [ ] Error messages don't reference specific industries
- [ ] Success messages are generic and customizable
- [ ] Placeholder text is configurable or neutral
- [ ] Help text doesn't assume user's business context

### Examples and Documentation
- [ ] Code examples use placeholder names (e.g., "Acme Corp", "Example Inc")
- [ ] Test data represents multiple industries
- [ ] Comments don't reference specific products or companies
- [ ] Documentation uses generic terminology
- [ ] README examples show diverse use cases

---

## 2. Database Schema Rules

### Table Naming
- [ ] Table names are generic (✅ `products`, ❌ `pump_parts`)
- [ ] Junction tables don't assume relationship types
- [ ] No industry-specific table names (❌ `restaurant_menus`, ❌ `real_estate_listings`)
- [ ] Use configurable metadata instead of specialized tables

### Column Naming
- [ ] Columns don't assume industry (✅ `item_name`, ❌ `part_number`)
- [ ] Generic identifier fields (✅ `external_id`, ❌ `sku`)
- [ ] Flexible categorization (✅ `category`, ❌ `product_line`)
- [ ] Avoid specialized columns (❌ `pump_model`, ❌ `dish_ingredients`)

### Configuration Tables
- [ ] `customer_configs` supports ANY business type
- [ ] JSON fields allow flexible, industry-specific metadata
- [ ] No hardcoded configuration values for specific industries
- [ ] Business type field is informational only, not limiting

### Examples:

**❌ BAD - Industry-specific:**
```sql
CREATE TABLE pump_parts (
  part_number VARCHAR(50),
  pump_model VARCHAR(100),
  concrete_type VARCHAR(50)
);
```

**✅ GOOD - Generic:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customer_configs(id),
  name TEXT NOT NULL,
  description TEXT,
  external_id TEXT, -- Could be SKU, item code, etc.
  metadata JSONB, -- Industry-specific fields go here
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API Endpoint Rules

### Route Naming
- [ ] Routes use generic resource names (✅ `/api/items`, ❌ `/api/pump-parts`)
- [ ] Avoid industry-specific endpoints (❌ `/api/restaurant/menu`)
- [ ] Use RESTful conventions with generic nouns
- [ ] Query parameters are business-neutral

### Request/Response Structure
- [ ] Request schemas don't assume product types
- [ ] Response fields are configurable based on customer settings
- [ ] Field names are industry-neutral
- [ ] Include `type` or `category` fields for customer-defined classification

### Error Messages
- [ ] Errors don't reference specific products or services
- [ ] Error codes are generic across all business types
- [ ] User-facing messages are brand-neutral

### Examples:

**❌ BAD - Industry-specific:**
```typescript
// Route: /api/products/pump-parts
export async function GET(request: Request) {
  const parts = await db.select().from('pump_parts');
  return Response.json({
    pumpParts: parts,
    message: 'Retrieved all pump parts successfully'
  });
}
```

**✅ GOOD - Generic:**
```typescript
// Route: /api/items
export async function GET(request: Request) {
  const { customerId } = await validateRequest(request);
  const items = await db
    .select()
    .from('products')
    .where('customer_id', customerId);

  return Response.json({
    items: items,
    message: 'Retrieved items successfully'
  });
}
```

---

## 4. Testing Requirements

### Multi-Tenant Test Scenarios
- [ ] Tests include at least 3 different business types
- [ ] Test data represents diverse industries (retail, services, food, etc.)
- [ ] Isolation between tenants is verified
- [ ] No test assumes specific product catalog

### Mock Data Standards
- [ ] Mock customers use placeholder names ("Test Restaurant", "Example Store")
- [ ] Mock products are generic ("Item A", "Service Package")
- [ ] Test configurations cover multiple business models
- [ ] Avoid real company names or products in tests

### Test Coverage
- [ ] API tests verify generic field names
- [ ] Database tests confirm flexible schema
- [ ] Integration tests use multiple tenant scenarios
- [ ] UI tests don't hardcode industry terms

### Examples:

**❌ BAD - Single industry:**
```typescript
describe('Product API', () => {
  it('should fetch pump parts', async () => {
    const parts = await fetch('/api/products?type=pump');
    expect(parts).toContain('Concrete Pump Model X');
  });
});
```

**✅ GOOD - Multi-tenant:**
```typescript
describe('Product API', () => {
  const scenarios = [
    {
      business: 'E-commerce Store',
      itemType: 'product',
      itemName: 'Widget A'
    },
    {
      business: 'Restaurant',
      itemType: 'menu_item',
      itemName: 'House Special'
    },
    {
      business: 'Service Provider',
      itemType: 'service',
      itemName: 'Consulting Package'
    },
  ];

  scenarios.forEach(({ business, itemType, itemName }) => {
    it(`should fetch items for ${business}`, async () => {
      const items = await fetch(`/api/items?customer=${business}`);
      expect(items.some(i => i.name === itemName)).toBe(true);
    });
  });
});
```

---

## 5. Real Examples: Good vs Bad Code

### Example 1: Chat System Response

**❌ BAD - Hardcoded industry assumptions:**
```typescript
async function generateChatResponse(query: string) {
  const systemPrompt = `
    You are a helpful assistant for a concrete pump parts website.
    Help customers find the right pump parts and accessories.
    Our main products include concrete pumps, parts, and maintenance services.
  `;

  if (query.includes('pump')) {
    return "Let me help you find the right concrete pump!";
  }
}
```

**✅ GOOD - Generic and configurable:**
```typescript
async function generateChatResponse(
  query: string,
  customerConfig: CustomerConfig
) {
  const systemPrompt = `
    You are a helpful assistant for ${customerConfig.business_name}.
    ${customerConfig.business_description || 'Help customers with their inquiries.'}
    ${customerConfig.chat_instructions || ''}
  `;

  // Use customer's configured terminology
  const itemTerm = customerConfig.item_terminology || 'items';
  return `Let me help you find the right ${itemTerm}!`;
}
```

### Example 2: Search Functionality

**❌ BAD - Product-specific search:**
```typescript
async function searchProducts(query: string) {
  return db.query(`
    SELECT * FROM products
    WHERE
      part_number ILIKE $1 OR
      pump_model ILIKE $1 OR
      concrete_type ILIKE $1
  `, [`%${query}%`]);
}
```

**✅ GOOD - Generic search with metadata:**
```typescript
async function searchItems(
  query: string,
  customerId: string
) {
  return db.query(`
    SELECT * FROM products
    WHERE
      customer_id = $2 AND (
        name ILIKE $1 OR
        description ILIKE $1 OR
        external_id ILIKE $1 OR
        category ILIKE $1 OR
        metadata::text ILIKE $1
      )
  `, [`%${query}%`, customerId]);
}
```

### Example 3: UI Component

**❌ BAD - Hardcoded labels:**
```tsx
function ProductCard({ item }) {
  return (
    <div className="product-card">
      <h3>{item.name}</h3>
      <p>SKU: {item.sku}</p>
      <p>Pump Model: {item.model}</p>
      <button>Add to Cart</button>
    </div>
  );
}
```

**✅ GOOD - Configurable labels:**
```tsx
interface ItemCardProps {
  item: Item;
  config: {
    itemLabel?: string;
    idLabel?: string;
    actionLabel?: string;
    showMetadata?: string[];
  };
}

function ItemCard({ item, config }: ItemCardProps) {
  return (
    <div className="item-card">
      <h3>{item.name}</h3>
      {item.external_id && (
        <p>{config.idLabel || 'ID'}: {item.external_id}</p>
      )}
      {config.showMetadata?.map(key => (
        item.metadata?.[key] && (
          <p key={key}>{key}: {item.metadata[key]}</p>
        )
      ))}
      <button>{config.actionLabel || 'Select'}</button>
    </div>
  );
}
```

### Example 4: Database Migration

**❌ BAD - Specialized schema:**
```sql
CREATE TABLE restaurant_menu_items (
  id UUID PRIMARY KEY,
  dish_name VARCHAR(200),
  ingredients TEXT[],
  cuisine_type VARCHAR(50),
  spice_level INT
);
```

**✅ GOOD - Flexible generic schema:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customer_configs(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- metadata can contain industry-specific fields:
  -- E-commerce: {"sku": "ABC123", "size": "M", "color": "blue"}
  -- Restaurant: {"ingredients": [...], "spice_level": 3}
  -- Services: {"duration": "60min", "capacity": 10}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_customer ON products(customer_id);
CREATE INDEX idx_products_category ON products(customer_id, category);
CREATE INDEX idx_products_metadata ON products USING gin(metadata);
```

---

## 6. Configuration Over Code

### Customer Configuration Schema
All business-specific information should be stored in `customer_configs`:

```typescript
interface CustomerConfig {
  // Identity (generic)
  id: string;
  business_name: string;
  domain: string;

  // Business Type (informational only, not limiting)
  business_type?: 'ecommerce' | 'restaurant' | 'services' | 'other';
  business_description?: string;

  // Terminology Customization
  item_terminology?: string; // "products", "menu items", "services", etc.
  customer_terminology?: string; // "customers", "guests", "clients", etc.

  // Feature Flags
  features?: {
    shopping_cart?: boolean;
    reservations?: boolean;
    appointments?: boolean;
    // ... extensible
  };

  // Chat Configuration
  chat_instructions?: string;
  chat_welcome_message?: string;

  // Industry-specific data (flexible)
  metadata?: Record<string, any>;
}
```

### Usage Pattern:

```typescript
// ❌ BAD
const message = "Browse our pump parts catalog";

// ✅ GOOD
const config = await getCustomerConfig(customerId);
const itemTerm = config.item_terminology || 'items';
const message = `Browse our ${itemTerm} catalog`;
```

---

## 7. Refactoring Patterns

### Pattern 1: Extract Hardcoded Terms to Config

**Before:**
```typescript
function getProductLabel(product: Product): string {
  return `${product.name} - SKU: ${product.sku}`;
}
```

**After:**
```typescript
function getItemLabel(
  item: Item,
  config: CustomerConfig
): string {
  const idLabel = config.id_terminology || 'ID';
  return `${item.name} - ${idLabel}: ${item.external_id}`;
}
```

### Pattern 2: Metadata Instead of Columns

**Before:**
```typescript
interface Product {
  id: string;
  pump_model: string;
  concrete_type: string;
  pressure_rating: number;
}
```

**After:**
```typescript
interface Product {
  id: string;
  customer_id: string;
  name: string;
  description: string;
  metadata: {
    // Industry-specific fields go here
    [key: string]: any;
  };
}
```

### Pattern 3: Dynamic Field Mapping

**Before:**
```typescript
const columns = ['name', 'sku', 'price', 'stock'];
```

**After:**
```typescript
async function getDisplayColumns(customerId: string) {
  const config = await getCustomerConfig(customerId);
  return config.display_fields || ['name', 'external_id', 'category'];
}
```

---

## 8. Pre-Commit Checklist

### Quick Verification Steps

Before committing any code, verify:

1. **Text Search:**
   ```bash
   # Search for potential hardcoded brands/industries
   grep -r "pump\|concrete\|Cifa\|SKU" --include="*.ts" --include="*.tsx" ./lib ./app
   ```

2. **File Review:**
   - [ ] Read through changed files - any industry-specific terms?
   - [ ] Check variable names - are they generic?
   - [ ] Review UI text - is it configurable?
   - [ ] Examine database queries - do they assume schema?

3. **Test Multi-Tenant:**
   ```typescript
   // Run with different business types
   npm test -- --testNamePattern="multi-tenant"
   ```

4. **Configuration Check:**
   - [ ] New fields added to `customer_configs` if needed?
   - [ ] Defaults work for all business types?
   - [ ] No business logic in code that should be in config?

5. **Documentation:**
   - [ ] Examples use generic placeholder names?
   - [ ] Comments don't reference specific industries?
   - [ ] README sections are business-neutral?

---

## 9. Common Violations and Fixes

### Violation 1: Hardcoded Industry Terms

**Found:** `"Browse our pump parts"`
**Fix:** Use customer config: `Browse our ${config.item_terminology || 'items'}`

### Violation 2: Specialized Database Columns

**Found:** `pump_model VARCHAR(100)`
**Fix:** Use generic: `metadata JSONB` with `{"model": "XYZ"}`

### Violation 3: Product-Specific Validation

**Found:**
```typescript
if (!product.sku) throw new Error("SKU required");
```

**Fix:**
```typescript
const idField = config.required_id_field || 'external_id';
if (!product[idField]) throw new Error(`${idField} required`);
```

### Violation 4: UI Labels

**Found:** `<button>Add to Cart</button>`
**Fix:** `<button>{config.add_action_label || 'Select'}</button>`

### Violation 5: Route Names

**Found:** `/api/pump-parts/search`
**Fix:** `/api/items/search?customer_id=${customerId}`

---

## 10. Testing Your Changes

### Multi-Tenant Test Template

Use this template to verify brand-agnostic implementation:

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Feature: [Your Feature]', () => {
  const businessScenarios = [
    {
      name: 'E-commerce Store',
      config: {
        business_type: 'ecommerce',
        item_terminology: 'products',
        customer_terminology: 'customers',
      },
      testData: {
        item: { name: 'Widget A', external_id: 'WID-001' },
      },
    },
    {
      name: 'Restaurant',
      config: {
        business_type: 'restaurant',
        item_terminology: 'menu items',
        customer_terminology: 'guests',
      },
      testData: {
        item: { name: 'House Special', external_id: 'DISH-001' },
      },
    },
    {
      name: 'Service Provider',
      config: {
        business_type: 'services',
        item_terminology: 'services',
        customer_terminology: 'clients',
      },
      testData: {
        item: { name: 'Consulting Package', external_id: 'SVC-001' },
      },
    },
  ];

  businessScenarios.forEach(({ name, config, testData }) => {
    describe(`Scenario: ${name}`, () => {
      it('should work with business-specific terminology', async () => {
        const result = await yourFeature(testData.item, config);

        // Verify generic behavior
        expect(result).toBeDefined();

        // Verify configuration is respected
        expect(result.label).toContain(config.item_terminology);
      });
    });
  });
});
```

---

## 11. Architectural Principles

### Principle 1: Configuration Over Convention
Business-specific logic belongs in database configuration, not in code.

### Principle 2: Metadata for Specialization
Use JSONB metadata fields for industry-specific data instead of specialized columns.

### Principle 3: Generic Interfaces
All interfaces should be generic enough to support any business type.

### Principle 4: Tenant Isolation
Every query must filter by customer/tenant ID - never cross contaminate.

### Principle 5: Extensibility
Design APIs and schemas to be extended by configuration, not by code changes.

---

## 12. Review Checklist Summary

Print this out and keep it visible while coding:

```
BRAND-AGNOSTIC CODE REVIEW CHECKLIST
====================================

Code:
□ No hardcoded company/product names
□ No industry-specific terminology
□ All business data from customer_configs
□ Generic variable/function names
□ Configurable UI text

Database:
□ Generic table/column names
□ Metadata JSONB for specialization
□ No industry assumptions in schema

API:
□ Generic route names
□ Flexible request/response schemas
□ Brand-neutral error messages

Tests:
□ Multiple business type scenarios
□ Generic mock data
□ Tenant isolation verified

Pre-commit:
□ Text search for violations
□ Multi-tenant tests pass
□ Documentation is neutral
```

---

## Need Help?

If you're unsure whether something is brand-agnostic:

1. **Ask yourself:** "Would this work for a restaurant? A hospital? A real estate agency?"
2. **Check the rule:** If it's business-specific, it should be in `customer_configs`
3. **Use metadata:** When in doubt, use JSONB metadata for specialized fields
4. **Test multi-tenant:** Write tests with 3+ different business types

**Remember:** The goal is a system where adding a new customer (of ANY business type) requires zero code changes - only configuration.
