/**
 * WooCommerce Store API Client
 *
 * Handles cart operations via WooCommerce Store API (not REST API v3).
 * Store API provides session-based cart management for guest and authenticated users.
 *
 * Key Differences from REST API v3:
 * - REST API v3: Admin operations (products, orders, customers)
 * - Store API: Frontend operations (cart, checkout, session management)
 *
 * Endpoints:
 * - POST /wp-json/wc/store/v1/cart/add-item
 * - GET /wp-json/wc/store/v1/cart
 * - DELETE /wp-json/wc/store/v1/cart/items/{key}
 * - PUT /wp-json/wc/store/v1/cart/items/{key}
 * - POST /wp-json/wc/store/v1/cart/apply-coupon
 * - POST /wp-json/wc/store/v1/cart/remove-coupon
 *
 * @see https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/StoreApi/docs/cart.md
 */

import type { StoreAPICartResponse, StoreAPIResponse } from './types';
import { StoreAPIClient } from './client';

export class WooCommerceStoreAPI {
  private client: StoreAPIClient;

  constructor(config: { url: string; nonce?: string }) {
    this.client = new StoreAPIClient(config);
  }

  /**
   * Add item to cart
   */
  async addItem(productId: number, quantity: number = 1): Promise<StoreAPIResponse<StoreAPICartResponse>> {
    return this.client.request<StoreAPICartResponse>('/cart/add-item', {
      method: 'POST',
      body: JSON.stringify({
        id: productId,
        quantity,
      }),
    });
  }

  /**
   * Get cart contents
   */
  async getCart(): Promise<StoreAPIResponse<StoreAPICartResponse>> {
    return this.client.request<StoreAPICartResponse>('/cart');
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemKey: string): Promise<StoreAPIResponse<StoreAPICartResponse>> {
    return this.client.request<StoreAPICartResponse>(`/cart/items/${itemKey}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update item quantity
   */
  async updateItem(itemKey: string, quantity: number): Promise<StoreAPIResponse<StoreAPICartResponse>> {
    return this.client.request<StoreAPICartResponse>(`/cart/items/${itemKey}`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity,
      }),
    });
  }

  /**
   * Apply coupon to cart
   */
  async applyCoupon(code: string): Promise<StoreAPIResponse<StoreAPICartResponse>> {
    return this.client.request<StoreAPICartResponse>('/cart/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({
        code,
      }),
    });
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(code: string): Promise<StoreAPIResponse<StoreAPICartResponse>> {
    return this.client.request<StoreAPICartResponse>('/cart/remove-coupon', {
      method: 'POST',
      body: JSON.stringify({
        code,
      }),
    });
  }

  /**
   * Update session nonce
   */
  setNonce(nonce: string): void {
    this.client.setNonce(nonce);
  }

  /**
   * Check if Store API is available
   */
  async isAvailable(): Promise<boolean> {
    return this.client.isAvailable();
  }
}

// Re-export types
export type {
  StoreAPICartResponse,
  StoreAPICartItem,
  StoreAPICartTotals,
  StoreAPICoupon,
  StoreAPIError,
  StoreAPIResponse
} from './types';
