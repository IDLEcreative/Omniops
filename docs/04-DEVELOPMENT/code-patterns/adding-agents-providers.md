# Adding New Agents and Commerce Providers

## Overview

This guide explains how to add new commerce platform integrations to the system using the provider pattern. The architecture supports multiple e-commerce platforms (WooCommerce, Shopify, etc.) through a unified interface.

### What are Agents/Providers?

**Providers** are platform-specific implementations that interact with external commerce APIs (WooCommerce, Shopify, Magento, etc.). They implement a standard interface (`CommerceProvider`) to enable the chat system to work seamlessly across different e-commerce platforms.

**Agents** use these providers to perform commerce-related operations like:
- Looking up orders
- Searching products
- Checking stock availability
- Retrieving product details

### Provider Pattern Architecture

```
┌─────────────────┐
│  Chat System    │
│  (Route/Agent)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Commerce        │
│ Provider        │◄──── Standard Interface
│ Factory         │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────┐
│WooCom   │ │Shopify  │
│Provider │ │Provider │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│WooCom   │ │Shopify  │
│API      │ │API      │
└─────────┘ └─────────┘
```

**Key Benefits:**
- **Unified Interface**: All platforms expose the same methods
- **Dynamic Loading**: Providers are loaded based on customer configuration
- **Easy Extension**: Add new platforms without changing existing code
- **Type Safety**: TypeScript ensures consistent implementation
- **Multi-tenancy**: Each domain can use different platforms

### When to Create a New Provider

Create a new provider when:
- Adding support for a new e-commerce platform (Magento, BigCommerce, etc.)
- Integrating a new commerce API that doesn't fit existing providers
- Building custom commerce functionality for specific platforms

## Provider Interface

All commerce providers must implement the `CommerceProvider` interface:

### Base Interface

```typescript
// lib/agents/commerce-provider.ts

export interface CommerceProvider {
  // Platform identifier (e.g., 'woocommerce', 'shopify', 'magento')
  readonly platform: string;

  // Look up an order by ID and optional email
  lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null>;

  // Search for products by query string
  searchProducts(query: string, limit?: number): Promise<any[]>;

  // Check stock availability for a product
  checkStock(productId: string): Promise<any>;

  // Get detailed product information
  getProductDetails(productId: string): Promise<any>;
}
```

### OrderInfo Type

Standard order format returned by all providers:

```typescript
export interface OrderInfo {
  id: string | number;           // Platform-specific order ID
  number: string | number;       // Human-readable order number
  status: string;                // Order status
  date: string;                  // Order creation date
  total: string | number;        // Total amount
  currency: string;              // Currency code or symbol
  items: Array<{                 // Order line items
    name: string;
    quantity: number;
    total?: string;
  }>;
  billing?: {                    // Billing information
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  shipping?: any;                // Platform-specific shipping data
  trackingNumber?: string | null;
  permalink?: string | null;     // Link to order page
}
```

### Required Methods

All four methods are **required** for complete provider functionality:

1. **`lookupOrder()`** - Essential for customer service inquiries
2. **`searchProducts()`** - Core product discovery functionality
3. **`checkStock()`** - Real-time inventory information
4. **`getProductDetails()`** - Detailed product specifications

## Step-by-Step: Adding a New Commerce Provider

Let's walk through adding **Magento** support as a complete example.

### Step 1: Create Provider File

Create the provider implementation in `lib/agents/providers/`:

```bash
touch lib/agents/providers/magento-provider.ts
```

**File Structure:**
```typescript
/**
 * Magento Commerce Provider Implementation
 */

import { CommerceProvider, OrderInfo } from '../commerce-provider';
import { getDynamicMagentoClient } from '@/lib/magento-dynamic';

export class MagentoProvider implements CommerceProvider {
  readonly platform = 'magento';
  private domain: string;

  constructor(domain: string) {
    this.domain = domain;
  }

  // Implement all required methods...
}
```

### Step 2: Implement Interface Methods

#### 2.1 Order Lookup

```typescript
async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
  const magento = await getDynamicMagentoClient(this.domain);

  if (!magento) {
    return null;
  }

  try {
    let order = null;

    // Try to get order by ID first
    const numericId = parseInt(orderId, 10);
    if (!isNaN(numericId)) {
      try {
        order = await magento.getOrder(numericId);
      } catch (error) {
        console.log(`[Magento Provider] Order ID ${numericId} not found`);
      }
    }

    // If not found by ID, search by email or order number
    if (!order && (orderId || email)) {
      const searchTerm = email || orderId;
      const orders = await magento.searchOrders({
        searchCriteria: {
          filterGroups: [{
            filters: [{
              field: email ? 'customer_email' : 'increment_id',
              value: searchTerm,
              conditionType: 'eq'
            }]
          }],
          pageSize: 1
        }
      });

      if (orders && orders.items && orders.items.length > 0) {
        order = orders.items[0];
      }
    }

    if (!order) {
      return null;
    }

    // Convert to standard OrderInfo format
    return {
      id: order.entity_id,
      number: order.increment_id,
      status: order.status,
      date: order.created_at,
      total: order.grand_total,
      currency: order.order_currency_code,
      items: order.items?.map((item: any) => ({
        name: item.name,
        quantity: item.qty_ordered,
        total: item.row_total
      })) || [],
      billing: order.billing_address ? {
        firstName: order.billing_address.firstname,
        lastName: order.billing_address.lastname,
        email: order.customer_email
      } : undefined,
      shipping: order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address,
      trackingNumber: order.extension_attributes?.shipping_assignments?.[0]?.shipping?.total?.tracking_number || null,
      permalink: null // Magento doesn't provide public order URLs
    };
  } catch (error) {
    console.error('[Magento Provider] Order lookup error:', error);
    return null;
  }
}
```

#### 2.2 Product Search

```typescript
async searchProducts(query: string, limit: number = 10): Promise<any[]> {
  const magento = await getDynamicMagentoClient(this.domain);

  if (!magento) {
    return [];
  }

  try {
    const result = await magento.searchProducts({
      searchCriteria: {
        filterGroups: [{
          filters: [{
            field: 'name',
            value: `%${query}%`,
            conditionType: 'like'
          }]
        }],
        pageSize: limit,
        currentPage: 1
      }
    });

    return result.items || [];
  } catch (error) {
    console.error('[Magento Provider] Product search error:', error);
    return [];
  }
}
```

#### 2.3 Stock Check

```typescript
async checkStock(productId: string): Promise<any> {
  const magento = await getDynamicMagentoClient(this.domain);

  if (!magento) {
    return null;
  }

  try {
    // Magento uses SKU for product lookups
    const stockItem = await magento.getStockItem(productId);

    if (!stockItem) {
      return null;
    }

    const product = await magento.getProductBySku(productId);

    return {
      productName: product?.name || productId,
      sku: productId,
      stockStatus: stockItem.is_in_stock ? 'instock' : 'outofstock',
      stockQuantity: stockItem.qty,
      manageStock: stockItem.manage_stock,
      backorders: stockItem.backorders > 0 ? 'yes' : 'no'
    };
  } catch (error) {
    console.error('[Magento Provider] Stock check error:', error);
    return null;
  }
}
```

#### 2.4 Product Details

```typescript
async getProductDetails(productId: string): Promise<any> {
  const magento = await getDynamicMagentoClient(this.domain);

  if (!magento) {
    return null;
  }

  try {
    // Try by SKU first (Magento's primary identifier)
    return await magento.getProductBySku(productId);
  } catch (error) {
    console.error('[Magento Provider] Product details error:', error);
    return null;
  }
}
```

### Step 3: Add API Client

Create the platform API client in `lib/magento-api.ts`:

```typescript
/**
 * Magento REST API Client
 */

export interface MagentoConfig {
  url: string;          // Store URL (e.g., https://store.example.com)
  accessToken: string;  // Admin or Integration token
}

export class MagentoAPI {
  private baseUrl: string;
  private accessToken: string;

  constructor(config: MagentoConfig) {
    this.baseUrl = config.url.replace(/\/$/, '') + '/rest/V1';
    this.accessToken = config.accessToken;
  }

  /**
   * Make authenticated API request
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Magento API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: number): Promise<any> {
    return this.request(`/orders/${orderId}`);
  }

  /**
   * Search orders with criteria
   */
  async searchOrders(criteria: any): Promise<any> {
    const params = new URLSearchParams();

    // Convert search criteria to query parameters
    // Magento uses a complex query parameter format
    if (criteria.searchCriteria) {
      Object.entries(criteria.searchCriteria).forEach(([key, value]) => {
        params.append(`searchCriteria[${key}]`, JSON.stringify(value));
      });
    }

    return this.request(`/orders?${params.toString()}`);
  }

  /**
   * Search products
   */
  async searchProducts(criteria: any): Promise<any> {
    const params = new URLSearchParams();

    if (criteria.searchCriteria) {
      Object.entries(criteria.searchCriteria).forEach(([key, value]) => {
        params.append(`searchCriteria[${key}]`, JSON.stringify(value));
      });
    }

    return this.request(`/products?${params.toString()}`);
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<any> {
    return this.request(`/products/${encodeURIComponent(sku)}`);
  }

  /**
   * Get stock item by SKU
   */
  async getStockItem(sku: string): Promise<any> {
    return this.request(`/stockItems/${encodeURIComponent(sku)}`);
  }
}
```

### Step 4: Add Dynamic Client Loader

Create `lib/magento-dynamic.ts` for credential management:

```typescript
/**
 * Dynamic Magento Client Loader
 * Loads Magento configuration from database based on domain
 */

import { MagentoAPI } from './magento-api';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { decrypt } from '@/lib/encryption';

/**
 * Get Magento client with dynamic configuration from database
 * @param domain - The customer domain
 * @returns MagentoAPI instance or null if not configured
 */
export async function getDynamicMagentoClient(domain: string): Promise<MagentoAPI | null> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return null;
  }

  // Fetch configuration for this domain
  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('magento_url, magento_access_token')
    .eq('domain', domain)
    .single();

  if (error || !config || !config.magento_url) {
    return null;
  }

  if (!config.magento_url || !config.magento_access_token) {
    throw new Error('Magento configuration is incomplete');
  }

  // Decrypt the access token
  let accessToken: string;
  try {
    accessToken = decrypt(config.magento_access_token);
  } catch (error) {
    throw new Error('Failed to decrypt Magento credentials');
  }

  if (!accessToken) {
    throw new Error('Failed to decrypt Magento access token');
  }

  return new MagentoAPI({
    url: config.magento_url,
    accessToken,
  });
}
```

### Step 5: Add Configuration Support

#### 5.1 Database Schema

Add Magento fields to `customer_configs` table:

```sql
-- supabase/migrations/YYYYMMDD_add_magento_support.sql

-- Add Magento configuration columns
ALTER TABLE customer_configs
ADD COLUMN magento_url TEXT,
ADD COLUMN magento_access_token TEXT;

-- Add indexes for Magento lookups
CREATE INDEX idx_customer_configs_magento
ON customer_configs(domain)
WHERE magento_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN customer_configs.magento_url IS 'Magento store URL (e.g., https://store.example.com)';
COMMENT ON COLUMN customer_configs.magento_access_token IS 'Encrypted Magento admin/integration access token';
```

#### 5.2 Environment Variables (Optional)

For development/testing, add to `.env.local`:

```bash
# Magento Configuration (optional - can use database instead)
MAGENTO_URL=https://store.example.com
MAGENTO_ACCESS_TOKEN=your_access_token_here
```

### Step 6: Register Provider

Update `lib/agents/commerce-provider.ts` to include the new provider:

#### 6.1 Add to Type Definitions

```typescript
type CustomerConfig = {
  woocommerce_enabled?: boolean | null;
  woocommerce_url?: string | null;
  shopify_enabled?: boolean | null;
  shopify_shop?: string | null;
  magento_url?: string | null;            // ADD THIS
  magento_access_token?: string | null;   // ADD THIS
};
```

#### 6.2 Add Detection Function

```typescript
function hasMagentoSupport(config: CustomerConfig | null): boolean {
  // Check if database has Magento configuration
  if (config?.magento_url) {
    return true;
  }

  // Fallback to environment variables for backward compatibility
  return Boolean(
    process.env.MAGENTO_URL &&
    process.env.MAGENTO_ACCESS_TOKEN
  );
}

const detectMagento: ProviderDetector = async ({ domain, config }) => {
  if (!hasMagentoSupport(config)) {
    return null;
  }

  try {
    const { MagentoProvider } = await import('./providers/magento-provider');
    return new MagentoProvider(domain);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize Magento provider:', error);
    return null;
  }
};
```

#### 6.3 Update Provider Array

```typescript
// Add Magento to the detector list (order matters - first match wins)
const providerDetectors: ProviderDetector[] = [
  detectShopify,
  detectWooCommerce,
  detectMagento,  // ADD THIS
];
```

### Step 7: Add Tests

Create comprehensive tests in `__tests__/lib/agents/providers/magento-provider.test.ts`:

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MagentoProvider } from '@/lib/agents/providers/magento-provider';

// Mock the Magento API client
jest.mock('@/lib/magento-dynamic', () => ({
  getDynamicMagentoClient: jest.fn(),
}));

const { getDynamicMagentoClient } = jest.requireMock('@/lib/magento-dynamic');

describe('MagentoProvider', () => {
  let provider: MagentoProvider;
  const mockDomain = 'store.example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new MagentoProvider(mockDomain);
  });

  describe('platform', () => {
    it('should identify as magento', () => {
      expect(provider.platform).toBe('magento');
    });
  });

  describe('lookupOrder', () => {
    it('should find order by ID', async () => {
      const mockOrder = {
        entity_id: 12345,
        increment_id: '100000123',
        status: 'complete',
        created_at: '2024-01-15T10:30:00Z',
        grand_total: 99.99,
        order_currency_code: 'USD',
        customer_email: 'test@example.com',
        items: [{
          name: 'Test Product',
          qty_ordered: 2,
          row_total: 99.99
        }],
        billing_address: {
          firstname: 'John',
          lastname: 'Doe'
        }
      };

      const mockClient = {
        getOrder: jest.fn().mockResolvedValue(mockOrder),
      };

      getDynamicMagentoClient.mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('12345');

      expect(result).toEqual({
        id: 12345,
        number: '100000123',
        status: 'complete',
        date: '2024-01-15T10:30:00Z',
        total: 99.99,
        currency: 'USD',
        items: [{
          name: 'Test Product',
          quantity: 2,
          total: 99.99
        }],
        billing: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com'
        },
        shipping: undefined,
        trackingNumber: null,
        permalink: null
      });
    });

    it('should return null when order not found', async () => {
      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('Not found')),
        searchOrders: jest.fn().mockResolvedValue({ items: [] }),
      };

      getDynamicMagentoClient.mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('99999');
      expect(result).toBeNull();
    });

    it('should return null when client is not configured', async () => {
      getDynamicMagentoClient.mockResolvedValue(null);

      const result = await provider.lookupOrder('12345');
      expect(result).toBeNull();
    });
  });

  describe('searchProducts', () => {
    it('should search products successfully', async () => {
      const mockProducts = {
        items: [
          { id: 1, sku: 'PROD-001', name: 'Test Product 1' },
          { id: 2, sku: 'PROD-002', name: 'Test Product 2' },
        ]
      };

      const mockClient = {
        searchProducts: jest.fn().mockResolvedValue(mockProducts),
      };

      getDynamicMagentoClient.mockResolvedValue(mockClient);

      const result = await provider.searchProducts('test', 10);

      expect(result).toEqual(mockProducts.items);
      expect(mockClient.searchProducts).toHaveBeenCalledWith({
        searchCriteria: {
          filterGroups: [{
            filters: [{
              field: 'name',
              value: '%test%',
              conditionType: 'like'
            }]
          }],
          pageSize: 10,
          currentPage: 1
        }
      });
    });

    it('should return empty array on error', async () => {
      const mockClient = {
        searchProducts: jest.fn().mockRejectedValue(new Error('API error')),
      };

      getDynamicMagentoClient.mockResolvedValue(mockClient);

      const result = await provider.searchProducts('test');
      expect(result).toEqual([]);
    });
  });

  describe('checkStock', () => {
    it('should check stock for product', async () => {
      const mockStock = {
        is_in_stock: true,
        qty: 50,
        manage_stock: true,
        backorders: 0
      };

      const mockProduct = {
        name: 'Test Product',
        sku: 'PROD-001'
      };

      const mockClient = {
        getStockItem: jest.fn().mockResolvedValue(mockStock),
        getProductBySku: jest.fn().mockResolvedValue(mockProduct),
      };

      getDynamicMagentoClient.mockResolvedValue(mockClient);

      const result = await provider.checkStock('PROD-001');

      expect(result).toEqual({
        productName: 'Test Product',
        sku: 'PROD-001',
        stockStatus: 'instock',
        stockQuantity: 50,
        manageStock: true,
        backorders: 'no'
      });
    });

    it('should return null when product not found', async () => {
      const mockClient = {
        getStockItem: jest.fn().mockResolvedValue(null),
      };

      getDynamicMagentoClient.mockResolvedValue(mockClient);

      const result = await provider.checkStock('INVALID');
      expect(result).toBeNull();
    });
  });

  describe('getProductDetails', () => {
    it('should get product details by SKU', async () => {
      const mockProduct = {
        id: 123,
        sku: 'PROD-001',
        name: 'Test Product',
        price: 49.99,
        description: 'Test description'
      };

      const mockClient = {
        getProductBySku: jest.fn().mockResolvedValue(mockProduct),
      };

      getDynamicMagentoClient.mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('PROD-001');

      expect(result).toEqual(mockProduct);
      expect(mockClient.getProductBySku).toHaveBeenCalledWith('PROD-001');
    });

    it('should return null on error', async () => {
      const mockClient = {
        getProductBySku: jest.fn().mockRejectedValue(new Error('Not found')),
      };

      getDynamicMagentoClient.mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('INVALID');
      expect(result).toBeNull();
    });
  });
});
```

### Step 8: Add Test Endpoint

Create `app/api/magento/test/route.ts`:

```typescript
/**
 * Magento Integration Test Endpoint
 * Tests Magento API connection and credentials
 */

import { NextResponse } from 'next/server';
import { getDynamicMagentoClient } from '@/lib/magento-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain parameter is required' },
      { status: 400 }
    );
  }

  try {
    const magento = await getDynamicMagentoClient(domain);

    if (!magento) {
      return NextResponse.json(
        {
          success: false,
          error: 'Magento is not configured for this domain',
          configured: false,
        },
        { status: 404 }
      );
    }

    // Test the connection by fetching a small set of products
    try {
      const result = await magento.searchProducts({
        searchCriteria: {
          pageSize: 1,
          currentPage: 1
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Magento connection successful',
        configured: true,
        productCount: result.items?.length || 0,
        testProduct: result.items?.[0] ? {
          id: result.items[0].id,
          sku: result.items[0].sku,
          name: result.items[0].name,
        } : null,
      });
    } catch (apiError: any) {
      return NextResponse.json(
        {
          success: false,
          configured: true,
          error: 'Magento API connection failed',
          details: apiError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize Magento client',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
```

### Step 9: Add Documentation

Create setup documentation explaining configuration:

```markdown
# Magento Integration Setup

## Prerequisites

- Magento 2.x store
- Admin or Integration access token
- Store URL

## Configuration

### 1. Generate Access Token

In your Magento admin panel:
1. Navigate to System > Integrations
2. Click "Add New Integration"
3. Fill in required fields
4. Under "API" tab, select required resources:
   - Orders (read)
   - Products (read)
   - Stock/Inventory (read)
5. Save and activate
6. Copy the access token

### 2. Store Configuration

Add to database via customer dashboard:
- **Magento URL**: Your store URL (e.g., https://store.example.com)
- **Access Token**: The integration token from step 1

Credentials are encrypted before storage.

### 3. Test Connection

Test the integration:
```bash
curl "http://localhost:3000/api/magento/test?domain=yourdomain.com"
```

## API Permissions Required

- `Magento_Sales::sales` - Read orders
- `Magento_Catalog::catalog` - Read products
- `Magento_CatalogInventory::cataloginventory` - Read stock

## Troubleshooting

See main troubleshooting section below.
```

## Complete Code Example

Here's a complete, production-ready provider implementation based on the Magento example:

```typescript
/**
 * Magento Commerce Provider - Complete Implementation
 * Location: lib/agents/providers/magento-provider.ts
 */

import { CommerceProvider, OrderInfo } from '../commerce-provider';
import { getDynamicMagentoClient } from '@/lib/magento-dynamic';

/**
 * Magento-specific types
 */
interface MagentoOrder {
  entity_id: number;
  increment_id: string;
  status: string;
  created_at: string;
  grand_total: number;
  order_currency_code: string;
  customer_email: string;
  items: Array<{
    name: string;
    qty_ordered: number;
    row_total: number;
  }>;
  billing_address?: {
    firstname: string;
    lastname: string;
  };
  extension_attributes?: {
    shipping_assignments?: Array<{
      shipping?: {
        address?: any;
        total?: {
          tracking_number?: string;
        };
      };
    }>;
  };
}

/**
 * Magento Commerce Provider
 * Implements CommerceProvider interface for Magento 2.x stores
 */
export class MagentoProvider implements CommerceProvider {
  readonly platform = 'magento';
  private domain: string;

  constructor(domain: string) {
    this.domain = domain;
  }

  /**
   * Look up an order by ID or email
   */
  async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
    const magento = await getDynamicMagentoClient(this.domain);

    if (!magento) {
      console.log('[Magento Provider] Client not configured for domain:', this.domain);
      return null;
    }

    try {
      let order: MagentoOrder | null = null;

      // Strategy 1: Try to get order by numeric ID
      const numericId = parseInt(orderId, 10);
      if (!isNaN(numericId)) {
        try {
          order = await magento.getOrder(numericId);
        } catch (error) {
          console.log(`[Magento Provider] Order ID ${numericId} not found`);
        }
      }

      // Strategy 2: Search by email if provided
      if (!order && email) {
        const result = await magento.searchOrders({
          searchCriteria: {
            filterGroups: [{
              filters: [{
                field: 'customer_email',
                value: email,
                conditionType: 'eq'
              }]
            }],
            pageSize: 1
          }
        });

        if (result.items && result.items.length > 0) {
          order = result.items[0];
        }
      }

      // Strategy 3: Search by increment ID (order number)
      if (!order && orderId) {
        const result = await magento.searchOrders({
          searchCriteria: {
            filterGroups: [{
              filters: [{
                field: 'increment_id',
                value: orderId,
                conditionType: 'eq'
              }]
            }],
            pageSize: 1
          }
        });

        if (result.items && result.items.length > 0) {
          order = result.items[0];
        }
      }

      if (!order) {
        return null;
      }

      // Convert to standard OrderInfo format
      return this.convertToOrderInfo(order);
    } catch (error) {
      console.error('[Magento Provider] Order lookup error:', error);
      return null;
    }
  }

  /**
   * Search for products by query string
   */
  async searchProducts(query: string, limit: number = 10): Promise<any[]> {
    const magento = await getDynamicMagentoClient(this.domain);

    if (!magento) {
      return [];
    }

    try {
      const result = await magento.searchProducts({
        searchCriteria: {
          filterGroups: [{
            filters: [{
              field: 'name',
              value: `%${query}%`,
              conditionType: 'like'
            }]
          }],
          pageSize: limit,
          currentPage: 1
        }
      });

      return result.items || [];
    } catch (error) {
      console.error('[Magento Provider] Product search error:', error);
      return [];
    }
  }

  /**
   * Check stock availability for a product
   */
  async checkStock(productId: string): Promise<any> {
    const magento = await getDynamicMagentoClient(this.domain);

    if (!magento) {
      return null;
    }

    try {
      const stockItem = await magento.getStockItem(productId);

      if (!stockItem) {
        return null;
      }

      // Get product name
      let productName = productId;
      try {
        const product = await magento.getProductBySku(productId);
        productName = product?.name || productId;
      } catch (error) {
        // Use SKU as fallback
      }

      return {
        productName,
        sku: productId,
        stockStatus: stockItem.is_in_stock ? 'instock' : 'outofstock',
        stockQuantity: stockItem.qty,
        manageStock: stockItem.manage_stock,
        backorders: stockItem.backorders > 0 ? 'yes' : 'no'
      };
    } catch (error) {
      console.error('[Magento Provider] Stock check error:', error);
      return null;
    }
  }

  /**
   * Get detailed product information
   */
  async getProductDetails(productId: string): Promise<any> {
    const magento = await getDynamicMagentoClient(this.domain);

    if (!magento) {
      return null;
    }

    try {
      return await magento.getProductBySku(productId);
    } catch (error) {
      console.error('[Magento Provider] Product details error:', error);
      return null;
    }
  }

  /**
   * Helper: Convert Magento order to standard OrderInfo format
   */
  private convertToOrderInfo(order: MagentoOrder): OrderInfo {
    const shippingAssignment = order.extension_attributes?.shipping_assignments?.[0];

    return {
      id: order.entity_id,
      number: order.increment_id,
      status: order.status,
      date: order.created_at,
      total: order.grand_total,
      currency: order.order_currency_code,
      items: order.items?.map(item => ({
        name: item.name,
        quantity: item.qty_ordered,
        total: item.row_total.toString()
      })) || [],
      billing: order.billing_address ? {
        firstName: order.billing_address.firstname,
        lastName: order.billing_address.lastname,
        email: order.customer_email
      } : undefined,
      shipping: shippingAssignment?.shipping?.address,
      trackingNumber: shippingAssignment?.shipping?.total?.tracking_number || null,
      permalink: null // Magento doesn't provide public order URLs by default
    };
  }
}
```

## Real Examples

### WooCommerce Provider

**Location:** `lib/agents/providers/woocommerce-provider.ts`

**What it does well:**
- Flexible order lookup (by ID, order number, or email)
- Comprehensive error handling with fallback strategies
- Clean conversion to standard OrderInfo format
- Efficient product search with status filtering

**Key patterns:**
```typescript
// Multiple lookup strategies
if (!isNaN(numericId)) {
  try {
    order = await wc.getOrder(numericId);
  } catch (error) {
    // Silently try next strategy
  }
}

// Fallback to search
if (!order) {
  const orders = await wc.getOrders({
    search: searchTerm,
    per_page: 1,
  });
}
```

### Shopify Provider

**Location:** `lib/agents/providers/shopify-provider.ts`

**What it does well:**
- Client-side filtering for API limitations
- Handles multiple order number formats (#1001, 1001)
- Variant-level stock management
- Clear error logging at each step

**Key patterns:**
```typescript
// Client-side filtering when API doesn't support it
order = orders.find(o => o.email === email) || null;

// Multiple identifier matching
order = orders.find(o =>
  o.name === orderId ||
  o.name === `#${orderId}` ||
  o.order_number.toString() === orderId
) || null;

// Variant-level operations
const variant = product.variants.find(v => v.sku === productId)
  || product.variants[0];
```

## Testing Providers

### Mock Strategy

Use Jest mocks to simulate API clients:

```typescript
// __tests__/lib/agents/providers/your-provider.test.ts

jest.mock('@/lib/your-platform-dynamic', () => ({
  getDynamicYourPlatformClient: jest.fn(),
}));

const { getDynamicYourPlatformClient } = jest.requireMock('@/lib/your-platform-dynamic');

describe('YourProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful API response', async () => {
    const mockClient = {
      getOrder: jest.fn().mockResolvedValue(mockOrderData),
    };

    getDynamicYourPlatformClient.mockResolvedValue(mockClient);

    const provider = new YourProvider('test.com');
    const result = await provider.lookupOrder('123');

    expect(result).toBeDefined();
    expect(mockClient.getOrder).toHaveBeenCalledWith(123);
  });

  it('should handle API errors gracefully', async () => {
    const mockClient = {
      getOrder: jest.fn().mockRejectedValue(new Error('API Error')),
    };

    getDynamicYourPlatformClient.mockResolvedValue(mockClient);

    const provider = new YourProvider('test.com');
    const result = await provider.lookupOrder('123');

    expect(result).toBeNull();
  });

  it('should handle missing client configuration', async () => {
    getDynamicYourPlatformClient.mockResolvedValue(null);

    const provider = new YourProvider('test.com');
    const result = await provider.lookupOrder('123');

    expect(result).toBeNull();
  });
});
```

### Test Data Fixtures

Create reusable test data:

```typescript
// __tests__/fixtures/magento-fixtures.ts

export const mockMagentoOrder = {
  entity_id: 12345,
  increment_id: '100000123',
  status: 'complete',
  created_at: '2024-01-15T10:30:00Z',
  grand_total: 99.99,
  order_currency_code: 'USD',
  customer_email: 'test@example.com',
  items: [{
    name: 'Test Product',
    qty_ordered: 2,
    row_total: 99.99
  }],
  billing_address: {
    firstname: 'John',
    lastname: 'Doe'
  }
};

export const mockMagentoProduct = {
  id: 123,
  sku: 'PROD-001',
  name: 'Test Product',
  price: 49.99,
  description: 'Test description',
  status: 1,
  visibility: 4
};

export const mockMagentoStock = {
  is_in_stock: true,
  qty: 50,
  manage_stock: true,
  backorders: 0,
  min_qty: 0
};
```

### Integration Testing

Create integration tests that test the full flow:

```typescript
// __tests__/integration/magento-provider.integration.test.ts

import { MagentoProvider } from '@/lib/agents/providers/magento-provider';

// Only run integration tests if credentials are configured
const INTEGRATION_ENABLED = process.env.MAGENTO_URL &&
                           process.env.MAGENTO_ACCESS_TOKEN;

describe.skipIf(!INTEGRATION_ENABLED)('Magento Provider Integration', () => {
  let provider: MagentoProvider;

  beforeAll(() => {
    provider = new MagentoProvider('test-domain.com');
  });

  it('should connect to real Magento instance', async () => {
    const products = await provider.searchProducts('test', 1);
    expect(Array.isArray(products)).toBe(true);
  }, 10000); // Allow 10s timeout for real API

  it('should handle real order lookup', async () => {
    // Use a known test order ID from your test store
    const order = await provider.lookupOrder('100000001');

    if (order) {
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('items');
    }
  }, 10000);
});
```

### Test Route Pattern

Test endpoints follow this pattern:

**URL:** `/api/[platform]/test?domain=example.com`

**Returns:**
```json
{
  "success": true,
  "message": "Platform connection successful",
  "configured": true,
  "productCount": 1,
  "testProduct": {
    "id": 123,
    "name": "Test Product"
  }
}
```

**Use for:**
- Verifying credentials
- Testing API connectivity
- Debugging configuration issues
- Customer onboarding validation

## Configuration Management

### Credential Storage

All commerce credentials are stored in the `customer_configs` table:

```sql
CREATE TABLE customer_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT UNIQUE NOT NULL,

  -- WooCommerce
  woocommerce_url TEXT,
  woocommerce_consumer_key TEXT,      -- Encrypted
  woocommerce_consumer_secret TEXT,   -- Encrypted

  -- Shopify
  shopify_shop TEXT,
  shopify_access_token TEXT,          -- Encrypted

  -- Magento (example)
  magento_url TEXT,
  magento_access_token TEXT,          -- Encrypted

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Encryption Requirements

**All API credentials MUST be encrypted before storage.**

```typescript
import { encrypt, decrypt } from '@/lib/encryption';

// Before saving to database
const encryptedToken = encrypt(plainToken);

// When retrieving from database
const plainToken = decrypt(encryptedToken);
```

**Encryption functions:**
- **Algorithm:** AES-256-GCM
- **Key source:** `ENCRYPTION_KEY` environment variable
- **Format:** `iv:encryptedData:authTag` (colon-separated)

### Dynamic Credential Loading

Providers load credentials dynamically based on the request domain:

```typescript
export async function getDynamicPlatformClient(domain: string) {
  const supabase = await createServiceRoleClient();

  // Fetch domain-specific configuration
  const { data: config } = await supabase
    .from('customer_configs')
    .select('platform_url, platform_token')
    .eq('domain', domain)
    .single();

  if (!config) {
    return null;
  }

  // Decrypt credentials
  const token = decrypt(config.platform_token);

  // Return initialized client
  return new PlatformAPI({
    url: config.platform_url,
    token: token
  });
}
```

**Benefits:**
- Multi-tenant support (different credentials per domain)
- No hardcoded credentials in code
- Centralized credential management
- Easy credential rotation

## Common Patterns

### Pagination Handling

Different platforms use different pagination formats:

**WooCommerce (offset-based):**
```typescript
const products = await wc.getProducts({
  per_page: 10,
  page: 1
});
```

**Shopify (limit-based):**
```typescript
const products = await shopify.getProducts({
  limit: 10
});
```

**Magento (complex):**
```typescript
const result = await magento.searchProducts({
  searchCriteria: {
    pageSize: 10,
    currentPage: 1
  }
});
```

**Best Practice:** Abstract pagination in your provider:
```typescript
async searchProducts(query: string, limit: number = 10): Promise<any[]> {
  // Internally map to platform-specific pagination
  const result = await client.search({
    query,
    pageSize: limit  // Or per_page, or limit - depending on platform
  });

  return result.items || result.products || result || [];
}
```

### Error Mapping

Map platform-specific errors to standard responses:

```typescript
try {
  return await client.getOrder(id);
} catch (error: any) {
  // Log the platform-specific error
  console.error('[Provider] API error:', error);

  // Map to standard error codes
  if (error.code === 'woocommerce_rest_invalid_id') {
    return null;  // Not found
  }

  if (error.code === 'rest_no_route') {
    throw new Error('Invalid API endpoint');
  }

  // Default: return null or throw based on severity
  return null;
}
```

### Rate Limiting

Some platforms have strict rate limits. Implement client-side throttling:

```typescript
export class PlatformAPI {
  private lastRequestTime = 0;
  private minRequestInterval = 100; // ms between requests

  private async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  async request(endpoint: string) {
    await this.throttle();
    return fetch(endpoint);
  }
}
```

### Caching Strategies

Cache frequently accessed data:

```typescript
export class PlatformProvider implements CommerceProvider {
  private productCache = new Map<string, { data: any; expiresAt: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getProductDetails(productId: string): Promise<any> {
    const cached = this.productCache.get(productId);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const product = await this.client.getProduct(productId);

    this.productCache.set(productId, {
      data: product,
      expiresAt: Date.now() + this.CACHE_TTL
    });

    return product;
  }
}
```

## Checklist for New Provider

Use this checklist when implementing a new provider:

### Implementation
- [ ] Provider class created in `lib/agents/providers/[platform]-provider.ts`
- [ ] Implements `CommerceProvider` interface
- [ ] Platform identifier set correctly (`readonly platform`)
- [ ] All four methods implemented:
  - [ ] `lookupOrder()`
  - [ ] `searchProducts()`
  - [ ] `checkStock()`
  - [ ] `getProductDetails()`

### API Client
- [ ] API client created in `lib/[platform]-api.ts`
- [ ] Authentication configured correctly
- [ ] Error handling implemented
- [ ] Rate limiting considered/implemented
- [ ] Timeout handling configured

### Dynamic Loading
- [ ] Dynamic loader created in `lib/[platform]-dynamic.ts`
- [ ] Loads configuration from database
- [ ] Decrypts credentials properly
- [ ] Handles missing configuration gracefully

### Configuration
- [ ] Database migration created
- [ ] Columns added to `customer_configs`:
  - [ ] `[platform]_url` or similar
  - [ ] `[platform]_access_token` or credentials
- [ ] Indexes created for performance
- [ ] Environment variables documented (optional)

### Provider Registration
- [ ] Type definitions updated in `commerce-provider.ts`
- [ ] Detection function created (`detectPlatform`)
- [ ] Support check function created (`hasPlatformSupport`)
- [ ] Added to `providerDetectors` array
- [ ] Cache clearing handled properly

### Testing
- [ ] Unit tests created in `__tests__/lib/agents/providers/`
- [ ] All methods tested (success and failure cases)
- [ ] Mock strategy implemented
- [ ] Test fixtures created
- [ ] Integration tests created (if possible)
- [ ] Test endpoint created in `app/api/[platform]/test/`

### Documentation
- [ ] Setup guide created
- [ ] Configuration instructions documented
- [ ] Required API permissions listed
- [ ] Example queries documented
- [ ] Troubleshooting section added
- [ ] This main guide updated with new platform

### Security
- [ ] All credentials encrypted before storage
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly scoped
- [ ] Error messages don't leak sensitive data

### Performance
- [ ] Pagination implemented correctly
- [ ] Caching strategy considered
- [ ] Rate limiting handled
- [ ] Database queries optimized

## Troubleshooting

### Authentication Failures

**Symptom:** API returns 401 Unauthorized

**Causes:**
- Expired or invalid credentials
- Incorrect credential format
- Decryption failure
- Wrong API endpoint

**Solutions:**
1. Verify credentials in database are correct
2. Test decryption manually:
   ```typescript
   const decrypted = decrypt(encryptedToken);
   console.log('Decrypted length:', decrypted.length);
   ```
3. Check API client configuration
4. Verify API base URL is correct
5. Test with curl to isolate issue:
   ```bash
   curl -H "Authorization: Bearer TOKEN" https://api.platform.com/endpoint
   ```

### API Version Mismatches

**Symptom:** Unexpected response format, missing fields

**Causes:**
- API version changed
- Response schema differs from expectations
- Platform upgrade broke compatibility

**Solutions:**
1. Check platform API version in use
2. Verify API documentation matches implementation
3. Add response validation:
   ```typescript
   if (!response.expected_field) {
     console.error('Unexpected API response:', response);
     throw new Error('API version mismatch');
   }
   ```
4. Update API client to match current version
5. Add version detection/negotiation

### Type Errors

**Symptom:** TypeScript compilation errors

**Causes:**
- Interface not fully implemented
- Return type mismatch
- Missing required fields in OrderInfo conversion

**Solutions:**
1. Ensure all interface methods are implemented:
   ```bash
   npx tsc --noEmit
   ```
2. Check OrderInfo conversion is complete:
   ```typescript
   return {
     id: order.id,
     number: order.number,
     status: order.status,
     // ... ensure ALL required fields present
   } satisfies OrderInfo;
   ```
3. Use type assertions carefully:
   ```typescript
   const order = response as PlatformOrder;
   ```

### Dynamic Loading Issues

**Symptom:** Provider not detected, returns null

**Causes:**
- Configuration not in database
- Domain mismatch
- Detection function returns false
- Import error in provider file

**Solutions:**
1. Verify configuration exists:
   ```sql
   SELECT * FROM customer_configs WHERE domain = 'example.com';
   ```
2. Check domain normalization:
   ```typescript
   const normalized = domain
     .replace(/^https?:\/\//, '')
     .replace(/^www\./, '')
     .toLowerCase();
   ```
3. Add debug logging to detection function:
   ```typescript
   console.log('[Provider] Checking support for:', domain);
   console.log('[Provider] Config:', config);
   ```
4. Clear provider cache:
   ```typescript
   clearCommerceProviderCache();
   ```
5. Verify import path is correct:
   ```typescript
   const { PlatformProvider } = await import('./providers/platform-provider');
   ```

### Common Error Messages

**"Platform is not configured for this domain"**
- Configuration missing from database
- Domain doesn't match any records
- Credentials not set up

**"Failed to decrypt credentials"**
- Wrong encryption key
- Corrupted encrypted data
- Invalid encryption format

**"API connection failed"**
- Network issue
- Wrong API URL
- Firewall blocking requests
- Rate limit exceeded

**"Provider not found"**
- Provider not registered in detector array
- Import path incorrect
- Platform identifier mismatch

---

## Summary

Adding a new commerce provider involves:

1. **Create provider class** implementing `CommerceProvider` interface
2. **Build API client** with authentication and error handling
3. **Add dynamic loader** for credential management
4. **Update database schema** to store platform credentials
5. **Register provider** in commerce-provider factory
6. **Write comprehensive tests** (unit + integration)
7. **Create test endpoint** for validation
8. **Document setup** and troubleshooting

The provider pattern ensures consistent behavior across platforms while allowing platform-specific optimizations. Follow the patterns established by WooCommerce and Shopify providers for best results.

**Key principles:**
- Always encrypt credentials before storage
- Return `null` for not-found scenarios (don't throw)
- Log errors but fail gracefully
- Use standard OrderInfo format for consistency
- Implement all interface methods completely
- Test thoroughly with mocks and real APIs
