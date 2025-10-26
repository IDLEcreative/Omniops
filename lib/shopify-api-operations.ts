/**
 * Shopify Admin API Operations
 * Implements all API operations for products, orders, inventory, and customers
 *
 * @see https://shopify.dev/docs/api/admin-rest
 */

import { ShopifyAPIClient } from './shopify-api-client';
import type {
  ShopifyProduct,
  ShopifyOrder,
  ShopifyCustomer,
  ShopifyInventoryLevel,
} from './shopify-api-types';

/**
 * Parameter types for API operations
 */
export interface GetProductsParams {
  ids?: string;
  limit?: number;
  since_id?: number;
  title?: string;
  vendor?: string;
  product_type?: string;
  collection_id?: number;
  created_at_min?: string;
  created_at_max?: string;
  updated_at_min?: string;
  updated_at_max?: string;
  published_at_min?: string;
  published_at_max?: string;
  published_status?: 'published' | 'unpublished' | 'any';
  fields?: string;
  status?: 'active' | 'archived' | 'draft';
}

export interface GetOrdersParams {
  ids?: string;
  limit?: number;
  since_id?: number;
  created_at_min?: string;
  created_at_max?: string;
  updated_at_min?: string;
  updated_at_max?: string;
  processed_at_min?: string;
  processed_at_max?: string;
  status?: 'open' | 'closed' | 'cancelled' | 'any';
  financial_status?: 'authorized' | 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'partially_refunded' | 'any';
  fulfillment_status?: 'shipped' | 'partial' | 'unshipped' | 'any';
  fields?: string;
}

export interface GetCustomersParams {
  ids?: string;
  limit?: number;
  since_id?: number;
  created_at_min?: string;
  created_at_max?: string;
  updated_at_min?: string;
  updated_at_max?: string;
  fields?: string;
}

export interface GetInventoryLevelParams {
  inventory_item_ids: string;
  location_ids?: string;
}

/**
 * Shopify API Operations Class
 * Extends the base client with all API operations
 */
export class ShopifyAPIOperations extends ShopifyAPIClient {
  /**
   * Products API - Get multiple products
   */
  async getProducts(params?: GetProductsParams): Promise<ShopifyProduct[]> {
    const queryParams = this.buildQueryParams(params);
    const result = await this.request<{ products: ShopifyProduct[] }>(
      `/products.json?${queryParams}`
    );
    return result.products;
  }

  /**
   * Products API - Get single product by ID
   */
  async getProduct(id: number): Promise<ShopifyProduct> {
    const result = await this.request<{ product: ShopifyProduct }>(
      `/products/${id}.json`
    );
    return result.product;
  }

  /**
   * Products API - Search products by title
   */
  async searchProducts(query: string, limit: number = 10): Promise<ShopifyProduct[]> {
    return this.getProducts({ title: query, limit });
  }

  /**
   * Orders API - Get multiple orders
   */
  async getOrders(params?: GetOrdersParams): Promise<ShopifyOrder[]> {
    const queryParams = this.buildQueryParams(params);
    const result = await this.request<{ orders: ShopifyOrder[] }>(
      `/orders.json?${queryParams}`
    );
    return result.orders;
  }

  /**
   * Orders API - Get single order by ID
   */
  async getOrder(id: number): Promise<ShopifyOrder> {
    const result = await this.request<{ order: ShopifyOrder }>(
      `/orders/${id}.json`
    );
    return result.order;
  }

  /**
   * Inventory API - Get inventory levels
   */
  async getInventoryLevel(params: GetInventoryLevelParams): Promise<ShopifyInventoryLevel[]> {
    const queryParams = this.buildQueryParams(params);
    const result = await this.request<{ inventory_levels: ShopifyInventoryLevel[] }>(
      `/inventory_levels.json?${queryParams}`
    );
    return result.inventory_levels;
  }

  /**
   * Customers API - Get multiple customers
   */
  async getCustomers(params?: GetCustomersParams): Promise<ShopifyCustomer[]> {
    const queryParams = this.buildQueryParams(params);
    const result = await this.request<{ customers: ShopifyCustomer[] }>(
      `/customers.json?${queryParams}`
    );
    return result.customers;
  }

  /**
   * Customers API - Get single customer by ID
   */
  async getCustomer(id: number): Promise<ShopifyCustomer> {
    const result = await this.request<{ customer: ShopifyCustomer }>(
      `/customers/${id}.json`
    );
    return result.customer;
  }

  /**
   * Customers API - Search customers by query
   */
  async searchCustomers(query: string): Promise<ShopifyCustomer[]> {
    const result = await this.request<{ customers: ShopifyCustomer[] }>(
      `/customers/search.json?query=${encodeURIComponent(query)}`
    );
    return result.customers;
  }
}
