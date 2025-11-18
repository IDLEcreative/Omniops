# WooCommerce API Integration

**Type:** API
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [WooCommerce Full Client](/home/user/Omniops/lib/woocommerce-full.ts), [WooCommerce Types](/home/user/Omniops/lib/woocommerce-full-types), [Encryption](/home/user/Omniops/lib/encryption.ts)
**Estimated Read Time:** 11 minutes

## Purpose

Complete TypeScript implementation of WooCommerce REST API v3 with modular architecture, type safety, comprehensive error handling, and efficient resource management.

## Quick Links
- [Main API Class](index.ts) - Unified interface
- [Products API](products.ts) - Product operations
- [Orders API](orders.ts) - Order management
- [Customers API](customers.ts) - Customer operations

## Keywords
- WooCommerce, REST API, E-commerce, TypeScript, Products, Orders, Customers, Error Handling

---

This directory contains a structured, modular implementation of the WooCommerce REST API v3 with TypeScript support, comprehensive error handling, and efficient resource management. It provides a clean abstraction layer for all WooCommerce operations.

## Overview

The WooCommerce API module provides:
- **Modular Architecture**: Organized by resource type (products, orders, customers, etc.)
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Lazy Loading**: Efficient resource utilization with on-demand module loading
- **Error Handling**: Robust error management and retry mechanisms
- **Batch Operations**: Support for bulk operations to improve performance
- **Caching**: Intelligent caching to reduce API calls

## Architecture

```
woocommerce-api/
├── index.ts        # Main API class with unified interface
├── products.ts     # Product management operations
├── orders.ts       # Order processing and management
├── customers.ts    # Customer data and operations
├── reports.ts      # Analytics and reporting
└── settings.ts     # Store configuration and settings
```

## Core Components

### Main API Class (`index.ts`)

Unified interface that provides access to all WooCommerce functionality:

```typescript
import { WooCommerceAPI } from '@/lib/woocommerce-api';

// Initialize with credentials
const wc = new WooCommerceAPI({
  url: 'https://your-store.com',
  consumerKey: 'ck_xxx',
  consumerSecret: 'cs_xxx'
});

// Or use environment variables (default)
const wc = new WooCommerceAPI();
```

**Key Features:**
- **Lazy Initialization**: Modules are loaded only when needed
- **Automatic Error Handling**: Built-in retry logic and error management
- **Method Delegation**: Clean API surface that delegates to specialized modules
- **Backward Compatibility**: Maintains compatibility with existing code

### Products API (`products.ts`)

Comprehensive product management with full CRUD operations:

**Core Operations:**
```typescript
// Get products with filtering
const products = await wc.getProducts({
  per_page: 20,
  status: 'publish',
  category: '15'
});

// Get single product
const product = await wc.getProduct(123);

// Create new product
const newProduct = await wc.createProduct({
  name: 'New Product',
  type: 'simple',
  regular_price: '29.99',
  description: 'Product description'
});

// Update product
await wc.updateProduct(123, {
  regular_price: '24.99',
  sale_price: '19.99'
});

// Batch operations
await wc.batchProducts({
  update: [
    { id: 1, price: '29.99' },
    { id: 2, price: '39.99' }
  ],
  delete: [3, 4, 5]
});
```

**Advanced Features:**
- Product variations management
- Product attributes and terms
- Product categories and tags
- Product reviews and ratings
- Shipping classes
- Inventory tracking

### Orders API (`orders.ts`)

Complete order lifecycle management:

**Core Operations:**
```typescript
// Get orders with filtering
const orders = await wc.getOrders({
  status: 'processing',
  per_page: 50,
  after: '2024-01-01T00:00:00'
});

// Get customer orders
const customerOrders = await wc.getOrders({
  customer: 123
});

// Update order status
await wc.updateOrder(456, {
  status: 'completed'
});

// Add order note
await wc.createOrderNote(456, {
  note: 'Package shipped via FedEx',
  customer_note: true
});

// Process refund
await wc.createOrderRefund(456, {
  amount: '25.00',
  reason: 'Customer request'
});
```

**Advanced Features:**
- Order notes management
- Refund processing
- Order line item modifications
- Shipping and billing address updates
- Order status transitions

### Customers API (`customers.ts`)

Customer data management and operations:

**Core Operations:**
```typescript
// Get customers
const customers = await wc.getCustomers({
  per_page: 100,
  orderby: 'registered_date'
});

// Find customer by email
const customer = await wc.getCustomerByEmail('user@example.com');

// Create new customer
const newCustomer = await wc.createCustomer({
  email: 'newuser@example.com',
  first_name: 'John',
  last_name: 'Doe',
  username: 'johndoe'
});

// Update customer
await wc.updateCustomer(123, {
  billing: {
    address_1: '123 New St',
    city: 'New City'
  }
});

// Get customer download permissions
const downloads = await wc.getCustomerDownloads(123);
```

### Reports API (`reports.ts`)

Analytics and business intelligence:

**Available Reports:**
```typescript
// Sales reports
const salesData = await wc.getSalesReport({
  period: 'week',
  date_min: '2024-01-01',
  date_max: '2024-01-31'
});

// Top selling products
const topSellers = await wc.getTopSellersReport({
  period: 'month',
  limit: 10
});

// Customer analytics
const customerMetrics = await wc.getCustomersReport();

// Inventory reports
const stockReport = await wc.getStockReport();

// Review analytics
const reviewMetrics = await wc.getReviewsReport();
```

### Settings API (`settings.ts`)

Store configuration and administrative functions:

**Configuration Management:**
```typescript
// Get all settings groups
const groups = await wc.getSettingsGroups();

// Get specific settings
const generalSettings = await wc.getSettings('general');

// Update store settings
await wc.updateSetting('general', 'woocommerce_store_address', {
  value: '123 Store Street'
});

// Batch update settings
await wc.batchUpdateSettings('general', {
  woocommerce_store_city: 'New City',
  woocommerce_store_postcode: '12345'
});
```

**Advanced Configuration:**
- Payment gateway management
- Shipping zones and methods
- Tax rates and classes
- Coupon management
- Webhook configuration
- System status monitoring

## Type Definitions

### Core Types
```typescript
interface Product {
  id: number;
  name: string;
  slug: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  categories: ProductCategory[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  variations: number[];
}

interface Order {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: OrderStatus;
  currency: string;
  date_created: string;
  date_modified: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  billing: BillingAddress;
  shipping: ShippingAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  line_items: LineItem[];
  shipping_lines: ShippingLine[];
  fee_lines: FeeLine[];
  coupon_lines: CouponLine[];
  refunds: Refund[];
}

interface Customer {
  id: number;
  date_created: string;
  date_modified: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: BillingAddress;
  shipping: ShippingAddress;
  is_paying_customer: boolean;
  orders_count: number;
  total_spent: string;
  avatar_url: string;
}
```

## Error Handling

### Comprehensive Error Management
```typescript
class WooCommerceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public data?: any
  ) {
    super(message);
    this.name = 'WooCommerceError';
  }
}

// Automatic retry logic
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Error Types
- **Authentication Errors**: Invalid credentials or expired tokens
- **Rate Limit Errors**: API quota exceeded
- **Validation Errors**: Invalid data format or missing required fields
- **Not Found Errors**: Requested resource doesn't exist
- **Server Errors**: WooCommerce server issues

## Performance Optimization

### 1. Batch Operations
```typescript
// Instead of multiple individual requests
for (const product of products) {
  await wc.updateProduct(product.id, product.updates);
}

// Use batch operations
await wc.batchProducts({
  update: products.map(p => ({ id: p.id, ...p.updates }))
});
```

### 2. Intelligent Caching
```typescript
import { WooCommerceCache } from '@/lib/woocommerce-cache';

class CachedWooCommerceAPI extends WooCommerceAPI {
  private cache = new WooCommerceCache();
  
  async getProduct(id: number): Promise<Product> {
    const cacheKey = `product:${id}`;
    
    let product = await this.cache.get(cacheKey);
    if (!product) {
      product = await super.getProduct(id);
      await this.cache.set(cacheKey, product, 300); // 5 minutes
    }
    
    return product;
  }
}
```

### 3. Request Optimization
```typescript
// Minimize API calls with smart parameter usage
const products = await wc.getProducts({
  include: [1, 2, 3, 4, 5], // Fetch specific products
  _fields: 'id,name,price,stock_status' // Only fetch needed fields
});
```

## Security Features

### 1. Credential Management
```typescript
import { encrypt, decrypt } from '@/lib/encryption';

class SecureWooCommerceAPI extends WooCommerceAPI {
  constructor(encryptedCredentials: string) {
    const credentials = JSON.parse(decrypt(encryptedCredentials));
    super(credentials);
  }
  
  static encryptCredentials(credentials: WooCommerceCredentials): string {
    return encrypt(JSON.stringify(credentials));
  }
}
```

### 2. Rate Limiting
```typescript
import { checkRateLimit } from '@/lib/rate-limit';

async function makeWooCommerceRequest(endpoint: string): Promise<any> {
  const { success } = await checkRateLimit('woocommerce-api', {
    requests: 100,
    window: 60 * 1000 // 1 minute
  });
  
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  
  return await this.client.get(endpoint);
}
```

## Testing

### Unit Tests
```typescript
describe('WooCommerce API', () => {
  let api: WooCommerceAPI;
  
  beforeEach(() => {
    api = new WooCommerceAPI({
      url: 'https://test-store.com',
      consumerKey: 'test_key',
      consumerSecret: 'test_secret'
    });
  });
  
  describe('Products', () => {
    it('should fetch products with filters', async () => {
      const products = await api.getProducts({
        status: 'publish',
        per_page: 10
      });
      
      expect(products).toHaveLength(10);
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('name');
    });
    
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        type: 'simple',
        regular_price: '29.99'
      };
      
      const product = await api.createProduct(productData);
      expect(product.name).toBe('Test Product');
      expect(product.regular_price).toBe('29.99');
    });
  });
});
```

### Integration Tests
```typescript
describe('WooCommerce Integration', () => {
  it('should handle complete order workflow', async () => {
    // Create customer
    const customer = await api.createCustomer({
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    });
    
    // Create order
    const order = await api.createOrder({
      customer_id: customer.id,
      line_items: [
        { product_id: 1, quantity: 2 }
      ]
    });
    
    // Update order status
    await api.updateOrder(order.id, { status: 'processing' });
    
    // Add order note
    await api.createOrderNote(order.id, {
      note: 'Order processed successfully'
    });
    
    expect(order.customer_id).toBe(customer.id);
  });
});
```

## Best Practices

### 1. Efficient Data Fetching
```typescript
// ✅ Fetch only needed fields
const products = await wc.getProducts({
  _fields: 'id,name,price,stock_status'
});

// ✅ Use appropriate page sizes
const orders = await wc.getOrders({
  per_page: 50, // Reasonable batch size
  status: 'processing'
});

// ❌ Avoid fetching unnecessary data
const products = await wc.getProducts(); // Fetches all fields
```

### 2. Error Handling
```typescript
try {
  const product = await wc.getProduct(123);
} catch (error) {
  if (error instanceof WooCommerceError) {
    if (error.statusCode === 404) {
      console.log('Product not found');
    } else if (error.statusCode === 401) {
      console.log('Authentication failed');
    }
  }
}
```

### 3. Resource Management
```typescript
// Use connection pooling for multiple requests
const api = new WooCommerceAPI();

// Batch related operations
const [products, orders, customers] = await Promise.all([
  api.getProducts({ per_page: 10 }),
  api.getOrders({ per_page: 10 }),
  api.getCustomers({ per_page: 10 })
]);
```

## Environment Configuration

### Required Environment Variables
```bash
# WooCommerce API Credentials
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Version and timeout settings
WOOCOMMERCE_API_VERSION=v3
WOOCOMMERCE_TIMEOUT=30000
```

### Configuration Options
```typescript
interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  version?: string; // Default: 'v3'
  timeout?: number; // Default: 30000ms
  queryStringAuth?: boolean; // Default: false
  axiosConfig?: AxiosRequestConfig;
}
```

## Troubleshooting

### Common Issues

**Issue: "Authentication failed"**
- **Cause:** Invalid consumer key or secret
- **Solution:** Verify credentials in `.env.local` or customer database
- **Test:** Run `curl` with credentials to verify API access

**Issue: "Rate limit exceeded"**
- **Cause:** Too many API requests in short time
- **Solution:** Implement request throttling or use batch operations
- **Check:** Review WooCommerce rate limiting policies

**Issue: "Product not found"**
- **Cause:** Product ID doesn't exist or product is not published
- **Solution:** Verify product exists in WooCommerce admin
- **Alternative:** Search by SKU instead of ID

**Issue: "Order update failed"**
- **Cause:** Invalid status transition or missing required fields
- **Solution:** Check valid order statuses and required fields
- **Reference:** WooCommerce order status lifecycle documentation

## Related Documentation

**Internal:**
- [lib/woocommerce-full.ts](/Users/jamesguy/Omniops/lib/woocommerce-full.ts) - Core WooCommerce client implementation
- [lib/woocommerce-types.ts](/Users/jamesguy/Omniops/lib/woocommerce-types.ts) - TypeScript type definitions
- [lib/woocommerce-cache.ts](/Users/jamesguy/Omniops/lib/woocommerce-cache.ts) - Caching layer for API responses
- [lib/woocommerce-dynamic.ts](/Users/jamesguy/Omniops/lib/woocommerce-dynamic.ts) - Dynamic endpoint routing
- [lib/encryption.ts](/Users/jamesguy/Omniops/lib/encryption.ts) - Credential encryption utilities
- [lib/agents/providers/woocommerce-provider.ts](/Users/jamesguy/Omniops/lib/agents/providers/woocommerce-provider.ts) - WooCommerce AI agent provider

**External:**
- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WooCommerce Authentication Guide](https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication)
- [WooCommerce Rate Limiting](https://woocommerce.github.io/woocommerce-rest-api-docs/#rate-limiting)

## Contributing

When working with the WooCommerce API:

1. **Follow REST Principles**: Use appropriate HTTP methods and status codes
2. **Implement Proper Error Handling**: Handle all possible error scenarios
3. **Optimize Performance**: Use batch operations and caching where appropriate
4. **Maintain Type Safety**: Keep TypeScript definitions up to date
5. **Test Thoroughly**: Include both unit and integration tests
6. **Document Changes**: Update documentation for any API changes

The WooCommerce API module is critical for e-commerce functionality and should be maintained with high standards for reliability, performance, and security.