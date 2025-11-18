# WooCommerce Full Types

**Type:** Utility
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [WooCommerce API](/home/user/Omniops/lib/woocommerce-api)
**Estimated Read Time:** 2 minutes

## Purpose

Comprehensive Zod schemas and TypeScript types for the WooCommerce REST API v3 with modular architecture and full type safety.

## Quick Links
- [Type Definitions Index](index.ts) - Main exports
- [Product Types](products.ts) - Product schemas
- [Order Types](orders.ts) - Order schemas
- [WooCommerce API](/home/user/Omniops/lib/woocommerce-api/README.md) - Integration layer

## Keywords
- WooCommerce, REST API, TypeScript, Zod, Type Safety, Schema Validation

---

## Structure

This module is organized by WooCommerce resource type for better maintainability:

```
woocommerce-full-types/
├── index.ts       - Main re-export module (use this for imports)
├── base.ts        - Shared base schemas and batch operation types
├── products.ts    - Product, variation, attribute, tag, shipping class
├── orders.ts      - Order, order note, refund schemas
├── customers.ts   - Customer and coupon schemas
└── system.ts      - Tax, shipping, payment, webhook, reports, system status
```

## Usage

### Importing Types and Schemas

```typescript
// Import from the index (recommended)
import { 
  ProductSchema, 
  type Product,
  OrderSchema,
  type Order
} from './woocommerce-full-types';

// Or import from specific modules
import { ProductSchema } from './woocommerce-full-types/products';
import { OrderSchema } from './woocommerce-full-types/orders';
```

### Available Schemas

#### Products (products.ts)
- `ProductSchema` - Full product with all WooCommerce fields
- `ProductVariationSchema` - Product variations
- `ProductAttributeSchema` - Product attributes
- `ProductTagSchema` - Product tags
- `ProductShippingClassSchema` - Shipping classes

#### Orders (orders.ts)
- `OrderSchema` - Complete order with line items, billing, shipping
- `OrderNoteSchema` - Order notes and comments
- `RefundSchema` - Refund details

#### Customers (customers.ts)
- `CustomerSchema` - Customer with addresses and metadata
- `CouponSchema` - Discount coupons

#### System (system.ts)
- `TaxRateSchema`, `TaxClassSchema` - Tax configuration
- `ShippingZoneSchema`, `ShippingMethodSchema` - Shipping
- `PaymentGatewaySchema` - Payment gateways
- `WebhookSchema` - Webhook configuration
- `SystemStatusSchema` - Store system information
- `SalesReportSchema`, `TopSellersReportSchema`, etc. - Reporting

#### Base (base.ts)
- `BaseSchema` - Common fields (id, dates)
- `MetaDataSchema` - WooCommerce metadata
- `BatchOperation<T>` - Batch operations interface
- `BatchResponse<T>` - Batch response interface

### Example: Validating API Response

```typescript
import { ProductSchema, type Product } from './woocommerce-full-types';

async function fetchProduct(id: number): Promise<Product> {
  const response = await wooCommerceClient.get(`products/${id}`);
  
  // Validate and parse with Zod
  const product = ProductSchema.parse(response.data);
  
  return product;
}
```

### Example: Batch Operations

```typescript
import { 
  type BatchOperation, 
  type BatchResponse,
  type Product 
} from './woocommerce-full-types';

const batchOp: BatchOperation<Product> = {
  create: [{ name: 'New Product', type: 'simple', price: '19.99' }],
  update: [{ id: 123, price: '24.99' }],
  delete: [456, 789]
};

const response: BatchResponse<Product> = await wooCommerceClient.post(
  'products/batch',
  batchOp
);
```

## Adding New Schemas

When adding new WooCommerce schemas:

1. Add the schema to the appropriate module based on resource type
2. Export the schema and its inferred type
3. Re-export from `index.ts` for public API
4. Keep each file under 300 LOC (split if needed)

## Migration Notes

This module was refactored from a single 578 LOC file to improve maintainability. The public API remains identical - all imports work the same way.

See `WOOCOMMERCE_TYPES_REFACTOR_SUMMARY.md` for details.
