# WooCommerce Full API Documentation

## Overview

The Customer Service Agent now has **full read/write access** to all WooCommerce REST API v3 endpoints. This enables comprehensive e-commerce support capabilities including order management, customer support, inventory tracking, and administrative functions.

## Table of Contents

1. [Architecture](#architecture)
2. [Authentication](#authentication)
3. [API Client Usage](#api-client-usage)
4. [Available Endpoints](#available-endpoints)
5. [Type Safety](#type-safety)
6. [Error Handling](#error-handling)
7. [Examples](#examples)
8. [Security Considerations](#security-considerations)

## Architecture

### File Structure
```
lib/
├── woocommerce-api.ts       # Main API client with all methods
├── woocommerce-full.ts      # Type definitions and schemas
└── woocommerce-dynamic.ts   # Multi-tenant dynamic client

app/api/admin/woocommerce/
└── [...path]/
    └── route.ts             # Dynamic API route handler
```

### Key Components

1. **WooCommerceAPI Class** (`lib/woocommerce-api.ts`)
   - Comprehensive client with methods for all WooCommerce endpoints
   - Full CRUD operations for all resource types
   - Batch operations support
   - Type-safe with Zod validation

2. **Type Definitions** (`lib/woocommerce-full.ts`)
   - Complete TypeScript interfaces for all WooCommerce resources
   - Zod schemas for runtime validation
   - Support for all resource types including variations, refunds, etc.

3. **Dynamic Route Handler** (`app/api/admin/woocommerce/[...path]/route.ts`)
   - Handles all HTTP methods (GET, POST, PUT, DELETE)
   - Dynamic routing to any WooCommerce endpoint
   - Supabase authentication
   - Comprehensive error handling

## Authentication

### API Authentication
The API uses Supabase authentication. All requests must include valid authentication headers.

```typescript
// Authentication is handled automatically in route handlers
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
```

### WooCommerce Authentication
WooCommerce credentials can be configured in two ways:

1. **Environment Variables** (Single-tenant)
   ```env
   WOOCOMMERCE_URL=https://your-store.com
   WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
   WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx
   ```

2. **Database Configuration** (Multi-tenant)
   ```typescript
   // Stored in customer_configs table
   {
     woocommerce_enabled: true,
     woocommerce_url: "https://store.com",
     woocommerce_consumer_key: "ck_xxxxx",
     woocommerce_consumer_secret: "cs_xxxxx"
   }
   ```

## API Client Usage

### Initialize the Client

```typescript
import { WooCommerceAPI } from '@/lib/woocommerce-api';

// Using environment variables
const wc = new WooCommerceAPI();

// Using custom configuration
const wc = new WooCommerceAPI({
  url: 'https://store.com',
  consumerKey: 'ck_xxxxx',
  consumerSecret: 'cs_xxxxx'
});

// For multi-tenant setup
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
const wc = await getDynamicWooCommerceClient('domain.com');
```

### Basic Operations

```typescript
// Products
const products = await wc.getProducts({ per_page: 20, status: 'publish' });
const product = await wc.getProduct(123);
const newProduct = await wc.createProduct({ name: 'New Product', type: 'simple' });
await wc.updateProduct(123, { price: '19.99' });
await wc.deleteProduct(123);

// Orders
const orders = await wc.getOrders({ status: ['processing'] });
const order = await wc.getOrder(456);
await wc.updateOrder(456, { status: 'completed' });

// Customers
const customer = await wc.getCustomerByEmail('customer@example.com');
const customers = await wc.getCustomers({ role: 'customer' });

// Refunds
const refund = await wc.createOrderRefund(456, {
  amount: '10.00',
  reason: 'Customer request'
});
```

### Batch Operations

```typescript
// Batch products
const result = await wc.batchProducts({
  create: [
    { name: 'Product 1', type: 'simple', regular_price: '10.00' },
    { name: 'Product 2', type: 'simple', regular_price: '20.00' }
  ],
  update: [
    { id: 123, price: '15.00' },
    { id: 124, stock_status: 'outofstock' }
  ],
  delete: [125, 126]
});

// Batch orders
const orderBatch = await wc.batchOrders({
  update: [
    { id: 456, status: 'processing' },
    { id: 457, status: 'completed' }
  ]
});
```

## Available Endpoints

### Products (`/products`)
- **Core**: List, Get, Create, Update, Delete, Batch
- **Variations**: Full CRUD for product variations
- **Attributes**: Manage product attributes and terms
- **Categories**: Product category management
- **Tags**: Product tag management
- **Reviews**: Product review management
- **Shipping Classes**: Shipping class management

### Orders (`/orders`)
- **Core**: List, Get, Create, Update, Delete, Batch
- **Notes**: Add and manage order notes
- **Refunds**: Create and manage refunds
- **Standalone Refunds** (v9.0+): Access all refunds directly

### Customers (`/customers`)
- **Core**: List, Get, Create, Update, Delete, Batch
- **Search**: Find by email
- **Downloads**: Get customer downloadable products

### Coupons (`/coupons`)
- **Core**: List, Get, Create, Update, Delete, Batch
- **Search**: Find by code
- **Usage**: Track coupon usage

### Reports (`/reports`)
- Sales reports with date filtering
- Top sellers analysis
- Customer reports
- Order statistics
- Product performance
- Coupon usage reports
- Review analytics

### Tax Management (`/taxes`)
- **Tax Rates**: Full CRUD operations
- **Tax Classes**: Create and manage tax classes
- **Location-based**: Configure by country/state

### Shipping (`/shipping`)
- **Zones**: Create and manage shipping zones
- **Zone Locations**: Assign locations to zones
- **Zone Methods**: Configure shipping methods per zone
- **Shipping Methods**: Access all available methods

### Payment Gateways (`/payment_gateways`)
- List all gateways
- Configure gateway settings
- Enable/disable gateways

### System & Settings
- **System Status**: Server info, database status, active plugins
- **Settings**: Read and update all WooCommerce settings
- **Tools**: Run system maintenance tools

### Webhooks (`/webhooks`)
- Create webhooks for real-time events
- Manage webhook subscriptions
- Configure delivery URLs and secrets

### Data Helpers (`/data`)
- Countries and states
- Currencies
- Continents
- Localization data

## Type Safety

All API methods return fully typed responses:

```typescript
import type { 
  Product, 
  Order, 
  Customer, 
  Coupon,
  Refund,
  TaxRate,
  ShippingZone,
  PaymentGateway,
  Webhook,
  SystemStatus
} from '@/lib/woocommerce-full';

// TypeScript knows the exact shape of the response
const product: Product = await wc.getProduct(123);
console.log(product.name); // Fully typed!
```

## Error Handling

The API client includes comprehensive error handling:

```typescript
try {
  const product = await wc.getProduct(999999);
} catch (error) {
  if (error.response?.status === 404) {
    console.log('Product not found');
  } else {
    console.error('API error:', error.message);
  }
}
```

API Route responses:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Examples

### Customer Service Scenarios

#### 1. Process a Refund
```typescript
// Find the order
const order = await wc.getOrder(12345);

// Create a partial refund
const refund = await wc.createOrderRefund(order.id, {
  amount: '25.00',
  reason: 'Product damaged in shipping',
  line_items: [
    {
      id: order.line_items[0].id,
      refund_total: 25.00
    }
  ]
});

// Add a note to the order
await wc.createOrderNote(order.id, {
  note: `Refund processed: $${refund.amount} - ${refund.reason}`,
  customer_note: true
});
```

#### 2. Update Customer Information
```typescript
// Find customer by email
const customer = await wc.getCustomerByEmail('john@example.com');

if (customer) {
  // Update shipping address
  await wc.updateCustomer(customer.id, {
    shipping: {
      first_name: 'John',
      last_name: 'Doe',
      address_1: '123 New Street',
      city: 'New York',
      state: 'NY',
      postcode: '10001',
      country: 'US'
    }
  });
}
```

#### 3. Check Product Availability
```typescript
// Search for products
const products = await wc.getProducts({
  search: 'laptop',
  stock_status: 'instock',
  per_page: 10
});

// Get detailed stock info
for (const product of products) {
  if (product.manage_stock) {
    console.log(`${product.name}: ${product.stock_quantity} in stock`);
  }
}
```

#### 4. Apply a Coupon
```typescript
// Verify coupon exists and is valid
const coupon = await wc.getCouponByCode('SAVE20');

if (coupon && coupon.usage_count < coupon.usage_limit) {
  // Coupon is valid
  console.log(`Coupon ${coupon.code}: ${coupon.amount}% off`);
} else {
  console.log('Coupon is invalid or expired');
}
```

### Administrative Tasks

#### 1. Bulk Update Product Prices
```typescript
// Get all products in a category
const products = await wc.getProducts({
  category: '15',
  per_page: 100
});

// Apply 10% discount
const updates = products.map(product => ({
  id: product.id,
  sale_price: (parseFloat(product.regular_price) * 0.9).toFixed(2)
}));

await wc.batchProducts({ update: updates });
```

#### 2. Generate Sales Report
```typescript
// Get sales for last month
const report = await wc.getSalesReport({
  period: 'last_month'
});

console.log('Last Month Sales:', {
  total_sales: report.total_sales,
  net_sales: report.net_sales,
  total_orders: report.total_orders,
  total_items: report.total_items
});

// Get top selling products
const topSellers = await wc.getTopSellersReport({
  period: 'last_month'
});
```

#### 3. Configure Shipping
```typescript
// Create a shipping zone
const zone = await wc.createShippingZone({
  name: 'United States',
  order: 1
});

// Add locations
await wc.updateShippingZoneLocations(zone.id, [
  { type: 'country', code: 'US' }
]);

// Add shipping method
await wc.createShippingZoneMethod(zone.id, {
  method_id: 'flat_rate',
  settings: {
    title: 'Standard Shipping',
    cost: '5.00'
  }
});
```

## Security Considerations

1. **API Key Security**
   - Store WooCommerce API keys securely
   - Use environment variables for sensitive data
   - Never expose keys in client-side code

2. **Access Control**
   - All endpoints require authentication
   - Implement role-based access if needed
   - Log all administrative actions

3. **Rate Limiting**
   - WooCommerce enforces rate limits
   - Implement request throttling for bulk operations
   - Cache frequently accessed data

4. **Data Validation**
   - All inputs are validated with Zod schemas
   - Sanitize user inputs before API calls
   - Validate business logic (e.g., refund amounts)

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```
   Error: Unauthorized
   ```
   - Verify Supabase authentication is working
   - Check WooCommerce API credentials
   - Ensure API keys have correct permissions

2. **404 Errors**
   ```
   Error: Endpoint not found
   ```
   - Verify WooCommerce is updated to latest version
   - Check if endpoint exists in your WooCommerce version
   - Ensure REST API is enabled in WooCommerce

3. **Rate Limiting**
   ```
   Error: Too many requests
   ```
   - Implement request throttling
   - Use batch operations where possible
   - Cache frequently accessed data

### Debug Mode

Enable debug logging:
```typescript
const wc = new WooCommerceAPI({
  url: process.env.WOOCOMMERCE_URL,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  wpAPIPrefix: 'wp-json',
  version: 'wc/v3',
  queryStringAuth: true,
  // Add axios request/response interceptors for debugging
});
```

## Next Steps

1. **Testing**: Use the provided test scripts to verify your setup
2. **Integration**: Integrate the API into your customer service workflows
3. **Monitoring**: Set up logging and monitoring for API usage
4. **Optimization**: Implement caching for frequently accessed data
5. **Security**: Review and implement additional security measures as needed