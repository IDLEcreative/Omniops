**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# E-commerce Provider System

**Purpose:** E-commerce provider implementations for WooCommerce and Shopify integrations with the AI agent system.

**Integration Type:** Service Provider
**Last Updated:** 2025-10-30
**Status:** Active

## Overview

This directory contains provider-specific implementations that integrate e-commerce platforms (WooCommerce, Shopify) with the AI agent system. Providers handle platform-specific data retrieval, order management, and customer verification.

## Architecture

```
providers/
├── shopify-provider.ts      # Shopify API integration
├── woocommerce-provider.ts  # WooCommerce API integration
└── README.md                # This file
```

Each provider implements a common interface for:
- Customer lookup and verification
- Order retrieval and management
- Product catalog access
- Cart operations

## Key Files

### WooCommerce Provider

**File:** [woocommerce-provider.ts](woocommerce-provider.ts)

**Purpose:** Integrates WooCommerce stores with AI agents for order tracking, customer lookup, and product information.

**Key Features:**
- Customer verification via email
- Order history retrieval
- Dynamic WooCommerce API client loading
- Error handling for missing credentials

**Usage:**
```typescript
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';

const provider = new WooCommerceProvider(domain);

// Look up customer by email
const customer = await provider.lookupCustomerByEmail('user@example.com');

// Get customer orders
const orders = await provider.getCustomerOrders(customerId);
```

**Dependencies:**
- `/lib/woocommerce-dynamic.ts` - Dynamic WooCommerce API client
- Customer credentials from database (encrypted)

### Shopify Provider

**File:** [shopify-provider.ts](shopify-provider.ts)

**Purpose:** Integrates Shopify stores with AI agents for customer and order management.

**Key Features:**
- Shopify Admin API integration
- Customer search and lookup
- Order retrieval with detailed line items
- GraphQL query support

**Usage:**
```typescript
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

const provider = new ShopifyProvider(domain);

// Look up customer by email
const customer = await provider.lookupCustomerByEmail('user@example.com');

// Get customer orders
const orders = await provider.getCustomerOrders(customerId);
```

**Dependencies:**
- `/lib/shopify-dynamic.ts` - Dynamic Shopify API client
- Shopify credentials from database (encrypted)

## Provider Interface

Providers implement a common interface for consistency:

```typescript
interface ECommerceProvider {
  // Customer operations
  lookupCustomerByEmail(email: string): Promise<Customer | null>;
  getCustomerOrders(customerId: string): Promise<Order[]>;

  // Order operations
  getOrderDetails(orderId: string): Promise<OrderDetails>;

  // Product operations (optional)
  searchProducts?(query: string): Promise<Product[]>;
  getProduct?(productId: string): Promise<Product>;
}
```

## Configuration

### Environment Variables

**WooCommerce:**
- Credentials stored in `customer_configs` table (encrypted)
- Retrieved dynamically based on customer domain

**Shopify:**
- Credentials stored in `customer_configs` table (encrypted)
- Shopify Admin API access token required

### Security

All provider credentials are:
- Encrypted using AES-256 encryption
- Stored in Supabase database
- Retrieved only when needed
- Never logged or exposed in responses

## Usage Examples

### Basic Customer Lookup

```typescript
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';

async function verifyCustomer(email: string, domain: string) {
  const provider = new WooCommerceProvider(domain);

  try {
    const customer = await provider.lookupCustomerByEmail(email);

    if (!customer) {
      return { verified: false, message: 'Customer not found' };
    }

    return {
      verified: true,
      customerId: customer.id,
      name: `${customer.first_name} ${customer.last_name}`
    };
  } catch (error) {
    console.error('Customer lookup failed:', error);
    return { verified: false, error: 'Lookup failed' };
  }
}
```

### Order Retrieval

```typescript
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

async function getRecentOrders(customerId: string, domain: string) {
  const provider = new ShopifyProvider(domain);

  try {
    const orders = await provider.getCustomerOrders(customerId);

    return orders.map(order => ({
      id: order.id,
      number: order.order_number,
      total: order.total_price,
      status: order.financial_status,
      items: order.line_items.length
    }));
  } catch (error) {
    console.error('Order retrieval failed:', error);
    return [];
  }
}
```

### Integration with AI Agents

```typescript
import { CustomerServiceAgent } from '@/lib/agents/customer-service-agent';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';

async function handleCustomerQuery(query: string, email: string, domain: string) {
  const provider = new WooCommerceProvider(domain);
  const agent = new CustomerServiceAgent();

  // Verify customer
  const customer = await provider.lookupCustomerByEmail(email);

  if (!customer) {
    return agent.getEnhancedSystemPrompt('none', false);
  }

  // Get customer orders
  const orders = await provider.getCustomerOrders(customer.id);

  // Build context for AI
  const context = agent.buildCompleteContext(
    'full',
    JSON.stringify({ customer, orders }),
    '',
    query
  );

  return context;
}
```

## Error Handling

Providers implement robust error handling:

```typescript
try {
  const customer = await provider.lookupCustomerByEmail(email);
} catch (error) {
  if (error.message.includes('credentials not found')) {
    // Handle missing credentials - prompt customer to configure
    console.error('E-commerce credentials not configured');
  } else if (error.message.includes('authentication')) {
    // Handle authentication errors - credentials may be invalid
    console.error('Invalid e-commerce credentials');
  } else if (error.message.includes('network')) {
    // Handle network errors - retry or graceful degradation
    console.error('Network error connecting to e-commerce platform');
  } else {
    // Generic error handling
    console.error('Provider error:', error);
  }
}
```

## Testing

### Unit Tests

```typescript
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';

describe('WooCommerce Provider', () => {
  it('should lookup customer by email', async () => {
    const provider = new WooCommerceProvider('test-store.com');
    const customer = await provider.lookupCustomerByEmail('test@example.com');

    expect(customer).toBeDefined();
    expect(customer.email).toBe('test@example.com');
  });

  it('should handle missing credentials gracefully', async () => {
    const provider = new WooCommerceProvider('unconfigured-store.com');

    await expect(
      provider.lookupCustomerByEmail('test@example.com')
    ).rejects.toThrow('credentials not found');
  });
});
```

### Integration Tests

```typescript
describe('Provider Integration', () => {
  it('should integrate with customer service agent', async () => {
    const provider = new WooCommerceProvider('test-store.com');
    const agent = new CustomerServiceAgent();

    const customer = await provider.lookupCustomerByEmail('test@example.com');
    const orders = await provider.getCustomerOrders(customer.id);

    const prompt = agent.getEnhancedSystemPrompt('full', true);

    expect(prompt).toContain('customer data');
    expect(orders).toHaveLength(2);
  });
});
```

## Troubleshooting

### Issue: "Credentials not found"

**Cause:** E-commerce credentials not configured for domain
**Solution:**
1. Check `customer_configs` table for domain
2. Ensure WooCommerce/Shopify credentials are properly stored
3. Verify encryption/decryption is working

### Issue: "Authentication failed"

**Cause:** Invalid API credentials
**Solution:**
1. Verify WooCommerce consumer key/secret are correct
2. Check Shopify access token is valid
3. Test credentials directly with API

### Issue: "Customer not found"

**Cause:** Email doesn't match any customer in e-commerce system
**Solution:**
1. Verify email is correct
2. Check if customer exists in WooCommerce/Shopify
3. Ensure case-sensitive matching if needed

## API Reference

### WooCommerceProvider

**Constructor:**
```typescript
constructor(domain: string)
```

**Methods:**
- `lookupCustomerByEmail(email: string): Promise<Customer | null>`
- `getCustomerOrders(customerId: string): Promise<Order[]>`

### ShopifyProvider

**Constructor:**
```typescript
constructor(domain: string)
```

**Methods:**
- `lookupCustomerByEmail(email: string): Promise<Customer | null>`
- `getCustomerOrders(customerId: string): Promise<Order[]>`

## Related Documentation

**Internal:**
- [lib/agents/README.md](/Users/jamesguy/Omniops/lib/agents/README.md) - Main agent system documentation
- [lib/woocommerce-dynamic.ts](/Users/jamesguy/Omniops/lib/woocommerce-dynamic.ts) - WooCommerce dynamic client
- [lib/shopify-dynamic.ts](/Users/jamesguy/Omniops/lib/shopify-dynamic.ts) - Shopify dynamic client
- [lib/encryption.ts](/Users/jamesguy/Omniops/lib/encryption.ts) - Credential encryption

**External:**
- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [Shopify Admin API Documentation](https://shopify.dev/api/admin)

## Contributing

When adding new providers:

1. **Implement Common Interface**: Follow the ECommerceProvider interface pattern
2. **Handle Errors Gracefully**: Provide meaningful error messages
3. **Secure Credentials**: Always use encrypted credentials from database
4. **Test Thoroughly**: Include unit and integration tests
5. **Document Usage**: Update this README with examples
6. **Consider Rate Limits**: Implement appropriate rate limiting for API calls

The provider system is critical for integrating e-commerce platforms with AI agents. All providers should prioritize security, reliability, and consistent error handling.
