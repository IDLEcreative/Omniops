# WooCommerce API Developer Reference

## Quick Reference

### Import Statements
```typescript
// Main API client
import { WooCommerceAPI } from '@/lib/woocommerce-api';

// Types
import type { 
  Product, ProductVariation, ProductAttribute,
  Order, OrderNote, Refund,
  Customer,
  Coupon,
  TaxRate, ShippingZone,
  PaymentGateway, Webhook
} from '@/lib/woocommerce-full';

// Dynamic client for multi-tenant
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
```

### Initialize Client
```typescript
// Using environment variables
const wc = new WooCommerceAPI();

// Using custom config
const wc = new WooCommerceAPI({
  url: 'https://store.com',
  consumerKey: 'ck_xxx',
  consumerSecret: 'cs_xxx'
});

// Multi-tenant
const wc = await getDynamicWooCommerceClient('domain.com');
```

## Method Reference

### Products

```typescript
// List products
await wc.getProducts({
  page?: number,
  per_page?: number,
  search?: string,
  status?: 'any' | 'draft' | 'pending' | 'private' | 'publish',
  type?: 'simple' | 'grouped' | 'external' | 'variable',
  sku?: string,
  featured?: boolean,
  category?: string,
  tag?: string,
  on_sale?: boolean,
  min_price?: string,
  max_price?: string,
  stock_status?: 'instock' | 'outofstock' | 'onbackorder',
  orderby?: 'date' | 'id' | 'title' | 'price' | 'popularity' | 'rating',
  order?: 'asc' | 'desc'
});

// Single product
await wc.getProduct(id: number);

// Create product
await wc.createProduct({
  name: string,
  type: 'simple' | 'grouped' | 'external' | 'variable',
  status?: 'draft' | 'pending' | 'private' | 'publish',
  regular_price?: string,
  sale_price?: string,
  description?: string,
  short_description?: string,
  sku?: string,
  manage_stock?: boolean,
  stock_quantity?: number,
  categories?: Array<{id: number}>,
  images?: Array<{src: string, alt?: string}>
});

// Update product
await wc.updateProduct(id: number, data: Partial<Product>);

// Delete product
await wc.deleteProduct(id: number, force?: boolean);

// Batch operations
await wc.batchProducts({
  create?: Partial<Product>[],
  update?: Array<{id: number} & Partial<Product>>,
  delete?: number[]
});
```

### Product Variations

```typescript
// List variations
await wc.getProductVariations(productId: number, params?: any);

// Get single variation
await wc.getProductVariation(productId: number, variationId: number);

// Create variation
await wc.createProductVariation(productId: number, {
  regular_price: string,
  attributes: Array<{id: number, option: string}>,
  manage_stock?: boolean,
  stock_quantity?: number
});

// Update variation
await wc.updateProductVariation(
  productId: number, 
  variationId: number, 
  data: Partial<ProductVariation>
);

// Delete variation
await wc.deleteProductVariation(
  productId: number, 
  variationId: number, 
  force?: boolean
);
```

### Orders

```typescript
// List orders
await wc.getOrders({
  page?: number,
  per_page?: number,
  status?: string[], // ['pending', 'processing', 'completed', etc.]
  customer?: number,
  product?: number,
  after?: string,  // ISO8601 date
  before?: string, // ISO8601 date
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug',
  order?: 'asc' | 'desc'
});

// Single order
await wc.getOrder(id: number);

// Create order
await wc.createOrder({
  payment_method: string,
  payment_method_title: string,
  set_paid?: boolean,
  status?: string,
  currency?: string,
  customer_id?: number,
  billing: {
    first_name: string,
    last_name: string,
    address_1: string,
    city: string,
    state: string,
    postcode: string,
    country: string,
    email: string,
    phone: string
  },
  shipping: { /* same as billing */ },
  line_items: Array<{
    product_id?: number,
    variation_id?: number,
    quantity: number,
    subtotal?: string,
    total?: string
  }>,
  shipping_lines?: Array<{
    method_id: string,
    method_title: string,
    total: string
  }>
});

// Update order
await wc.updateOrder(id: number, {
  status?: string,
  currency?: string,
  // ... other fields
});

// Delete order
await wc.deleteOrder(id: number, force?: boolean);
```

### Order Notes

```typescript
// List order notes
await wc.getOrderNotes(orderId: number, {
  type?: 'any' | 'customer' | 'internal'
});

// Get single note
await wc.getOrderNote(orderId: number, noteId: number);

// Create note
await wc.createOrderNote(orderId: number, {
  note: string,
  customer_note?: boolean // true = visible to customer
});

// Delete note
await wc.deleteOrderNote(orderId: number, noteId: number);
```

### Refunds

```typescript
// List refunds for order
await wc.getOrderRefunds(orderId: number);

// Get single refund
await wc.getOrderRefund(orderId: number, refundId: number);

// Create refund
await wc.createOrderRefund(orderId: number, {
  amount: string,
  reason?: string,
  refunded_by?: number,
  meta_data?: Array<{key: string, value: any}>,
  api_refund?: boolean, // Process through payment gateway
  line_items?: Array<{
    id: number,
    quantity?: number,
    refund_total?: number,
    refund_tax?: Array<{id: number, refund_total: number}>
  }>
});

// Delete refund
await wc.deleteOrderRefund(orderId: number, refundId: number);

// Get all refunds (WooCommerce 9.0+)
await wc.getRefunds();
await wc.getRefund(id: number);
```

### Customers

```typescript
// List customers
await wc.getCustomers({
  page?: number,
  per_page?: number,
  search?: string,
  email?: string,
  role?: string,
  orderby?: 'id' | 'include' | 'name' | 'registered_date',
  order?: 'asc' | 'desc'
});

// Single customer
await wc.getCustomer(id: number);

// Get by email
await wc.getCustomerByEmail(email: string);

// Create customer
await wc.createCustomer({
  email: string,
  first_name?: string,
  last_name?: string,
  username?: string,
  password?: string,
  billing?: { /* address fields */ },
  shipping?: { /* address fields */ }
});

// Update customer
await wc.updateCustomer(id: number, data: Partial<Customer>);

// Delete customer
await wc.deleteCustomer(id: number, force?: boolean);

// Get customer downloads
await wc.getCustomerDownloads(customerId: number);
```

### Coupons

```typescript
// List coupons
await wc.getCoupons({
  page?: number,
  per_page?: number,
  search?: string,
  code?: string,
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug',
  order?: 'asc' | 'desc'
});

// Single coupon
await wc.getCoupon(id: number);

// Get by code
await wc.getCouponByCode(code: string);

// Create coupon
await wc.createCoupon({
  code: string,
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product',
  amount: string,
  individual_use?: boolean,
  exclude_sale_items?: boolean,
  minimum_amount?: string,
  maximum_amount?: string,
  usage_limit?: number,
  usage_limit_per_user?: number,
  date_expires?: string, // ISO8601
  free_shipping?: boolean,
  product_ids?: number[],
  excluded_product_ids?: number[],
  product_categories?: number[],
  excluded_product_categories?: number[],
  email_restrictions?: string[]
});

// Update coupon
await wc.updateCoupon(id: number, data: Partial<Coupon>);

// Delete coupon
await wc.deleteCoupon(id: number, force?: boolean);
```

### Reports

```typescript
// Sales report
await wc.getSalesReport({
  period?: 'week' | 'month' | 'last_month' | 'year',
  date_min?: string, // YYYY-MM-DD
  date_max?: string  // YYYY-MM-DD
});
// Returns: {
//   total_sales, net_sales, total_orders, total_items,
//   total_tax, total_shipping, total_refunds, total_discount,
//   totals_grouped_by, totals
// }

// Top sellers
await wc.getTopSellersReport(params);
// Returns: Array<{title, product_id, quantity}>

// Other reports
await wc.getCouponsReport(params);
await wc.getCustomersReport(params);
await wc.getOrdersReport(params);
await wc.getProductsReport(params);
await wc.getReviewsReport(params);
```

### Tax Management

```typescript
// Tax rates
await wc.getTaxRates();
await wc.getTaxRate(id: number);
await wc.createTaxRate({
  country: string,
  state?: string,
  postcode?: string,
  city?: string,
  rate: string,
  name: string,
  class?: string,
  compound?: boolean,
  shipping?: boolean
});
await wc.updateTaxRate(id: number, data: Partial<TaxRate>);
await wc.deleteTaxRate(id: number);

// Tax classes
await wc.getTaxClasses();
await wc.createTaxClass({name: string, slug?: string});
await wc.deleteTaxClass(slug: string);
```

### Shipping

```typescript
// Shipping zones
await wc.getShippingZones();
await wc.getShippingZone(id: number);
await wc.createShippingZone({name: string, order?: number});
await wc.updateShippingZone(id: number, data);
await wc.deleteShippingZone(id: number);

// Zone locations
await wc.getShippingZoneLocations(zoneId: number);
await wc.updateShippingZoneLocations(zoneId: number, [
  {type: 'postcode', code: '90210'},
  {type: 'state', code: 'US:CA'},
  {type: 'country', code: 'US'},
  {type: 'continent', code: 'NA'}
]);

// Zone methods
await wc.getShippingZoneMethods(zoneId: number);
await wc.createShippingZoneMethod(zoneId: number, {
  method_id: 'flat_rate' | 'free_shipping' | 'local_pickup',
  settings?: { title?: string, cost?: string, /* ... */ }
});
await wc.updateShippingZoneMethod(zoneId, instanceId, data);
await wc.deleteShippingZoneMethod(zoneId, instanceId);

// Available shipping methods
await wc.getShippingMethods();
await wc.getShippingMethod(id: string);
```

### Payment Gateways

```typescript
// List gateways
await wc.getPaymentGateways();
// Returns array with: id, title, description, order, enabled, method_title, settings

// Get single gateway
await wc.getPaymentGateway(id: string);

// Update gateway settings
await wc.updatePaymentGateway(id: string, {
  enabled?: boolean,
  title?: string,
  description?: string,
  order?: number,
  settings?: Record<string, any>
});
```

### System & Settings

```typescript
// System status
await wc.getSystemStatus();
// Returns: environment, database, active_plugins, theme, settings, security, pages

// System tools
await wc.getSystemStatusTools();
await wc.getSystemStatusTool(id: string);
await wc.runSystemStatusTool(id: string);

// Settings groups
await wc.getSettingsGroups();
// Returns: ['general', 'products', 'tax', 'shipping', 'checkout', 'account', 'email', 'advanced']

// Settings in group
await wc.getSettingsOptions(groupId: string);
await wc.getSettingOption(groupId: string, optionId: string);
await wc.updateSettingOption(groupId: string, optionId: string, value: any);

// Batch update settings
await wc.batchUpdateSettings(groupId: string, [
  {id: 'option1', value: 'value1'},
  {id: 'option2', value: 'value2'}
]);
```

### Webhooks

```typescript
// List webhooks
await wc.getWebhooks({
  page?: number,
  per_page?: number,
  status?: 'all' | 'active' | 'paused' | 'disabled'
});

// Single webhook
await wc.getWebhook(id: number);

// Create webhook
await wc.createWebhook({
  name: string,
  topic: string, // e.g., 'order.created', 'product.updated'
  delivery_url: string,
  secret?: string,
  status?: 'active' | 'paused' | 'disabled'
});

// Update webhook
await wc.updateWebhook(id: number, data: Partial<Webhook>);

// Delete webhook
await wc.deleteWebhook(id: number);

// Available topics:
// coupon.created, coupon.updated, coupon.deleted, coupon.restored
// customer.created, customer.updated, customer.deleted
// order.created, order.updated, order.deleted, order.restored
// product.created, product.updated, product.deleted, product.restored
```

### Data Endpoints

```typescript
// Countries & states
await wc.getCountries();
// Returns: Array<{code, name, states}>

// Currencies
await wc.getCurrencies();
await wc.getCurrentCurrency();
// Returns: {code, name, symbol, position, thousand_separator, decimal_separator, num_decimals}

// Continents
await wc.getContinents();
// Returns: Array<{code, name, countries}>
```

## Error Handling

```typescript
try {
  const result = await wc.someMethod();
} catch (error) {
  if (error.response) {
    // API responded with error
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
    
    switch (error.response.status) {
      case 400:
        // Bad request - check your parameters
        break;
      case 401:
        // Authentication failed - check API keys
        break;
      case 404:
        // Resource not found
        break;
      case 429:
        // Rate limit exceeded
        break;
    }
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server');
  } else {
    // Error setting up request
    console.error('Error:', error.message);
  }
}
```

## Common Patterns

### Pagination
```typescript
async function getAllProducts() {
  const products = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const batch = await wc.getProducts({ 
      page, 
      per_page: 100 
    });
    
    products.push(...batch);
    hasMore = batch.length === 100;
    page++;
  }
  
  return products;
}
```

### Search with Fallback
```typescript
async function findProduct(query: string) {
  // Try SKU first
  const bySku = await wc.getProducts({ sku: query });
  if (bySku.length > 0) return bySku[0];
  
  // Search by name
  const byName = await wc.getProducts({ 
    search: query, 
    per_page: 1 
  });
  if (byName.length > 0) return byName[0];
  
  return null;
}
```

### Batch Updates with Progress
```typescript
async function bulkUpdatePrices(updates: Array<{id: number, price: string}>) {
  const batchSize = 100;
  const results = [];
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const result = await wc.batchProducts({
      update: batch.map(item => ({
        id: item.id,
        regular_price: item.price
      }))
    });
    
    results.push(result);
    console.log(`Progress: ${i + batch.length}/${updates.length}`);
  }
  
  return results;
}
```

### Cached Requests
```typescript
const cache = new Map();

async function getCachedProduct(id: number) {
  const key = `product_${id}`;
  
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.data;
    }
  }
  
  const product = await wc.getProduct(id);
  cache.set(key, {
    data: product,
    timestamp: Date.now()
  });
  
  return product;
}
```

## Performance Tips

1. **Use Batch Operations**: Instead of multiple individual requests
2. **Implement Caching**: Cache frequently accessed data
3. **Paginate Large Results**: Use per_page parameter
4. **Select Fields**: Use `_fields` parameter to reduce payload
5. **Parallel Requests**: Use Promise.all() for independent requests

## Security Best Practices

1. **Validate Input**: Always validate user input before API calls
2. **Sanitize Output**: Sanitize data before displaying to users
3. **Rate Limiting**: Implement your own rate limiting
4. **Audit Logging**: Log all modification operations
5. **Error Messages**: Don't expose sensitive information in errors