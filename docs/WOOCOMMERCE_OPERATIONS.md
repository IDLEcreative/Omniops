# WooCommerce Operations Documentation

**Last Updated:** 2025-10-29
**Total Operations:** 25
**Status:** Production-Ready ✅

This document provides comprehensive documentation for all 25 WooCommerce operations available through the Omniops AI chat system.

---

## Table of Contents

1. [Product Operations](#product-operations) (10 operations)
2. [Order Operations](#order-operations) (6 operations)
3. [Cart Operations](#cart-operations) (5 operations)
4. [Store Configuration](#store-configuration) (3 operations)
5. [Analytics & Reports](#analytics--reports) (3 operations)

---

## Product Operations

### 1. `search_products`
**Category:** Product Discovery
**Purpose:** Search for products using keywords and filters

**Parameters:**
```typescript
{
  query?: string;        // Search keywords (optional)
  category?: string;     // Filter by category (optional)
  minPrice?: number;     // Minimum price filter (optional)
  maxPrice?: number;     // Maximum price filter (optional)
  inStock?: boolean;     // Only show in-stock items (optional)
  limit?: number;        // Max results (default: 10)
}
```

**Example Usage:**
```typescript
// Search for products under £500
const result = await executeWooCommerceOperation(
  'search_products',
  { query: 'hydraulic', maxPrice: 500, limit: 5 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "Hydraulic Pump A4VTG90",
      "price": "£450.00",
      "sku": "A4VTG90",
      "stock_status": "instock"
    }
  ]
}
```

**Workflow:** Use as first step in Product Discovery Workflow

---

### 2. `get_product_details`
**Category:** Product Information
**Purpose:** Get complete details for a specific product

**Parameters:**
```typescript
{
  productId: string | number;  // Product ID or SKU (required)
}
```

**Example Usage:**
```typescript
// Get full details for product
const result = await executeWooCommerceOperation(
  'get_product_details',
  { productId: 'A4VTG90' },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Hydraulic Pump A4VTG90",
    "description": "High-performance hydraulic pump...",
    "price": "£450.00",
    "regular_price": "£500.00",
    "sale_price": "£450.00",
    "stock_status": "instock",
    "stock_quantity": 15,
    "sku": "A4VTG90",
    "categories": ["Pumps", "Hydraulic"],
    "images": [...],
    "attributes": [...]
  }
}
```

**Workflow:** Use as second step in Product Discovery Workflow (after search)

---

### 3. `check_stock`
**Category:** Inventory Check
**Purpose:** Check if a product is in stock (simple availability check)

**Parameters:**
```typescript
{
  productId: string | number;  // Product ID or SKU (required)
}
```

**Example Usage:**
```typescript
// Check if product is available
const result = await executeWooCommerceOperation(
  'check_stock',
  { productId: 'A4VTG90' },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "in_stock": true,
    "stock_status": "instock",
    "message": "Product is currently in stock"
  }
}
```

**Workflow:** Use as third step in Product Discovery Workflow (before recommending)

---

### 4. `get_stock_quantity`
**Category:** Inventory Check
**Purpose:** Get exact stock quantity for a product

**Parameters:**
```typescript
{
  productId: string | number;  // Product ID or SKU (required)
}
```

**Example Usage:**
```typescript
// Get exact inventory level
const result = await executeWooCommerceOperation(
  'get_stock_quantity',
  { productId: 'A4VTG90' },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stock_quantity": 15,
    "stock_status": "instock",
    "message": "15 units available"
  }
}
```

**When to Use:** Customer asks "How many do you have?" or "What's your inventory level?"

---

### 5. `check_price`
**Category:** Pricing
**Purpose:** Get current pricing for a specific product

**Parameters:**
```typescript
{
  productId: string | number;  // Product ID or SKU (required)
}
```

**Example Usage:**
```typescript
// Get current price
const result = await executeWooCommerceOperation(
  'check_price',
  { productId: 'A4VTG90' },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "price": "£450.00",
    "regular_price": "£500.00",
    "sale_price": "£450.00",
    "on_sale": true,
    "currency": "GBP"
  }
}
```

---

### 6. `get_product_variations`
**Category:** Product Information
**Purpose:** Get available variations (sizes, colors, voltages, etc.)

**Parameters:**
```typescript
{
  productId: string | number;  // Parent product ID (required)
}
```

**Example Usage:**
```typescript
// Get available variations
const result = await executeWooCommerceOperation(
  'get_product_variations',
  { productId: 123 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 124,
      "sku": "A4VTG90-12V",
      "price": "£450.00",
      "attributes": [
        { "name": "Voltage", "option": "12V" }
      ],
      "stock_status": "instock"
    }
  ]
}
```

---

### 7. `get_product_categories`
**Category:** Navigation
**Purpose:** List all product categories

**Parameters:**
```typescript
{
  parent?: number;  // Parent category ID (optional, 0 for top-level)
}
```

**Example Usage:**
```typescript
// Get all categories
const result = await executeWooCommerceOperation(
  'get_product_categories',
  {},
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "name": "Hydraulic Pumps",
      "slug": "hydraulic-pumps",
      "count": 45
    }
  ]
}
```

---

### 8. `get_product_reviews`
**Category:** Social Proof
**Purpose:** Get customer reviews for a product

**Parameters:**
```typescript
{
  productId: string | number;  // Product ID (required)
  limit?: number;               // Max reviews (default: 10)
}
```

**Example Usage:**
```typescript
// Get reviews
const result = await executeWooCommerceOperation(
  'get_product_reviews',
  { productId: 123, limit: 5 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "rating": 5,
      "review": "Excellent product!",
      "reviewer": "John D.",
      "date_created": "2025-10-15"
    }
  ]
}
```

---

### 9. `get_low_stock_products`
**Category:** Admin / Inventory Management
**Purpose:** Get products with low stock levels

**Parameters:**
```typescript
{
  threshold?: number;  // Stock level threshold (default: 5)
  limit?: number;      // Max results (default: 20)
}
```

**Example Usage:**
```typescript
// Get products with < 10 units
const result = await executeWooCommerceOperation(
  'get_low_stock_products',
  { threshold: 10, limit: 20 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "Hydraulic Pump",
      "sku": "A4VTG90",
      "stock_quantity": 3,
      "stock_status": "instock"
    }
  ]
}
```

**Use Case:** Business intelligence, inventory monitoring

---

## Order Operations

### 10. `check_order`
**Category:** Order Lookup
**Purpose:** Look up order by ID or customer email

**Parameters:**
```typescript
{
  orderId?: string | number;  // Order ID (optional)
  email?: string;              // Customer email (optional)
}
```

**Example Usage:**
```typescript
// Lookup by order ID
const result = await executeWooCommerceOperation(
  'check_order',
  { orderId: 12345 },
  'example.com'
);

// Lookup by email
const result = await executeWooCommerceOperation(
  'check_order',
  { email: 'customer@example.com' },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "status": "processing",
    "total": "£450.00",
    "date_created": "2025-10-29",
    "billing": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "line_items": [...]
  }
}
```

**Workflow:** Use as first step in Order Management Workflow

---

### 11. `get_shipping_info`
**Category:** Shipping
**Purpose:** Get general shipping information and policies

**Parameters:** None

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'get_shipping_info',
  {},
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shipping_methods": [...],
    "shipping_zones": [...],
    "free_shipping_threshold": "£100"
  }
}
```

---

### 12. `get_shipping_methods`
**Category:** Shipping
**Purpose:** Get available shipping methods

**Parameters:**
```typescript
{
  zone_id?: number;  // Shipping zone ID (optional)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'get_shipping_methods',
  {},
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "flat_rate",
      "title": "Flat Rate",
      "cost": "£5.00",
      "enabled": true
    }
  ]
}
```

---

### 13. `get_customer_orders`
**Category:** Order History
**Purpose:** Get all orders for a specific customer

**Parameters:**
```typescript
{
  email: string;     // Customer email (required)
  limit?: number;    // Max orders (default: 10)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'get_customer_orders',
  { email: 'customer@example.com', limit: 5 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "status": "completed",
      "total": "£450.00",
      "date_created": "2025-10-29"
    }
  ]
}
```

---

### 14. `get_order_notes`
**Category:** Order Details
**Purpose:** Get internal notes and updates for an order

**Parameters:**
```typescript
{
  orderId: string | number;  // Order ID (required)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'get_order_notes',
  { orderId: 12345 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "note": "Order shipped via DHL",
      "date_created": "2025-10-29",
      "customer_note": false
    }
  ]
}
```

**Workflow:** Use for tracking updates after initial order lookup

---

### 15. `check_refund_status`
**Category:** Refunds
**Purpose:** Check refund status for an order

**Parameters:**
```typescript
{
  orderId: string | number;  // Order ID (required)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'check_refund_status',
  { orderId: 12345 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refunds": [
      {
        "id": 456,
        "amount": "£450.00",
        "reason": "Customer request",
        "date_created": "2025-10-29"
      }
    ],
    "total_refunded": "£450.00"
  }
}
```

---

### 16. `cancel_order`
**Category:** Order Management
**Purpose:** Cancel an existing order

**Parameters:**
```typescript
{
  orderId: string | number;  // Order ID (required)
  reason?: string;            // Cancellation reason (optional)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'cancel_order',
  { orderId: 12345, reason: 'Customer request' },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "status": "cancelled",
    "message": "Order successfully cancelled"
  }
}
```

**Important:** Only works for orders with status: pending, on-hold, processing

---

## Cart Operations

### 17. `add_to_cart`
**Category:** Shopping Cart
**Purpose:** Add a product to the cart

**Parameters:**
```typescript
{
  productId: string | number;  // Product ID (required)
  quantity?: number;            // Quantity (default: 1)
  variationId?: number;         // Variation ID (optional)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'add_to_cart',
  { productId: 123, quantity: 2 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart_item_key": "abc123",
    "product_id": 123,
    "quantity": 2,
    "line_total": "£900.00"
  }
}
```

**Workflow:** Use as second step in Cart Workflow (after product search)

---

### 18. `get_cart`
**Category:** Shopping Cart
**Purpose:** Retrieve current cart contents

**Parameters:**
```typescript
{
  customerId?: string | number;  // Customer ID (optional)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'get_cart',
  {},
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "key": "abc123",
        "product_id": 123,
        "name": "Hydraulic Pump",
        "quantity": 2,
        "line_total": "£900.00"
      }
    ],
    "totals": {
      "subtotal": "£900.00",
      "total": "£900.00"
    }
  }
}
```

**Workflow:** Use as third step in Cart Workflow (after adding items)

---

### 19. `remove_from_cart`
**Category:** Shopping Cart
**Purpose:** Remove an item from the cart

**Parameters:**
```typescript
{
  productId: string | number;  // Product ID (required)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'remove_from_cart',
  { productId: 123 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Item removed from cart"
  }
}
```

---

### 20. `update_cart_quantity`
**Category:** Shopping Cart
**Purpose:** Update quantity for a cart item

**Parameters:**
```typescript
{
  productId: string | number;  // Product ID (required)
  quantity: number;             // New quantity (required)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'update_cart_quantity',
  { productId: 123, quantity: 5 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product_id": 123,
    "quantity": 5,
    "line_total": "£2,250.00"
  }
}
```

---

### 21. `apply_coupon_to_cart`
**Category:** Shopping Cart
**Purpose:** Apply a coupon/discount code to the cart

**Parameters:**
```typescript
{
  couponCode: string;  // Coupon code (required)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'apply_coupon_to_cart',
  { couponCode: 'SAVE10' },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coupon": "SAVE10",
    "discount": "£45.00",
    "new_total": "£405.00"
  }
}
```

**Workflow:** Use as fourth step in Cart Workflow (before checkout)

---

## Store Configuration

### 22. `get_payment_methods`
**Category:** Store Configuration
**Purpose:** Get available payment methods

**Parameters:** None

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'get_payment_methods',
  {},
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "stripe",
      "title": "Credit Card",
      "enabled": true,
      "description": "Pay with credit card"
    }
  ]
}
```

---

### 23. `validate_coupon`
**Category:** Coupons
**Purpose:** Check if a coupon code is valid before applying

**Parameters:**
```typescript
{
  couponCode: string;  // Coupon code (required)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'validate_coupon',
  { couponCode: 'SAVE10' },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "SAVE10",
    "valid": true,
    "discount_type": "percent",
    "amount": "10",
    "expiry_date": "2025-12-31"
  }
}
```

**Best Practice:** Always validate before applying to cart

---

## Analytics & Reports

### 24. `get_customer_insights`
**Category:** Business Intelligence
**Purpose:** Get customer analytics and insights

**Parameters:**
```typescript
{
  limit?: number;  // Max customers (default: 10)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'get_customer_insights',
  { limit: 5 },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "name": "John Doe",
      "email": "john@example.com",
      "total_spent": "£2,500.00",
      "orders_count": 15
    }
  ]
}
```

**Use Case:** Admin dashboard, customer LTV analysis

---

### 25. `get_sales_report`
**Category:** Business Intelligence
**Purpose:** Get sales reports and revenue analytics

**Parameters:**
```typescript
{
  period: 'day' | 'week' | 'month' | 'year';  // Report period (required)
  date_min?: string;                           // Start date YYYY-MM-DD (optional)
  date_max?: string;                           // End date YYYY-MM-DD (optional)
}
```

**Example Usage:**
```typescript
const result = await executeWooCommerceOperation(
  'get_sales_report',
  { period: 'week' },
  'example.com'
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_sales": "£15,250.00",
    "total_orders": 45,
    "total_items": 125,
    "average_order_value": "£338.89",
    "period": "week"
  }
}
```

**Use Case:** Admin dashboard, revenue reporting

---

## Workflows

### Product Discovery Workflow
1. **search_products** → Find products matching customer query
2. **get_product_details** → Get full details for specific product
3. **check_stock** → Verify availability before recommending

### Order Management Workflow
1. **check_order** (by ID or email) → Locate order
2. **get_order_notes** → Check for tracking updates
3. **check_refund_status** (if needed) → Verify refund status

### Cart Workflow
1. **search_products** → Find desired product
2. **add_to_cart** → Add item to cart
3. **get_cart** → Review cart contents
4. **apply_coupon_to_cart** → Apply discount (optional)

---

## Error Handling

All operations return a standardized response format:

```typescript
{
  success: boolean;
  data: any | null;
  message?: string;  // Present on errors
}
```

**Common Error Types:**
- `ConfigurationError` - WooCommerce not configured for domain
- `AxiosError` - API connection failed
- `ZodError` - Invalid response from WooCommerce API
- `ValidationError` - Invalid parameters provided

---

## Performance Notes

**Fast Operations (<100ms):**
- Cart operations: 62-70ms

**Medium Operations (1-3s):**
- Product searches: ~1.25s
- Category listings: ~2.65s
- Shipping/payment methods: ~1.5s

**Slow Operations (5-8s):**
- Analytics operations: 5-8s (acceptable for admin features)

---

## Testing

To test operations, use the validation test script:

```bash
npx tsx test-woocommerce-operations-corrected.ts
```

---

## Additional Resources

- **Phase 1 Report:** [PHASE1_COMPLETE_SUMMARY.md](../PHASE1_COMPLETE_SUMMARY.md)
- **Integration Plan:** [WOOCOMMERCE_TOOLS_CONNECTION_PLAN.md](../WOOCOMMERCE_TOOLS_CONNECTION_PLAN.md)
- **System Prompts:** [lib/chat/system-prompts.ts](../lib/chat/system-prompts.ts)
- **Tool Definition:** [lib/chat/woocommerce-types/tool-definition.ts](../lib/chat/woocommerce-types/tool-definition.ts)

---

**Last Updated:** 2025-10-29
**Verified Accurate:** All 25 operations tested end-to-end with 100% functional success rate
