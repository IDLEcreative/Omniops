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

// ==================== TYPES ====================

export interface StoreAPICartResponse {
  items: StoreAPICartItem[];
  items_count: number;
  items_weight: number;
  cross_sells: Array<{ id: number; name: string; prices: any }>;
  needs_payment: boolean;
  needs_shipping: boolean;
  has_calculated_shipping: boolean;
  fees: any[];
  totals: StoreAPICartTotals;
  shipping_address: any;
  billing_address: any;
  coupons: StoreAPICoupon[];
  errors: any[];
  payment_methods: string[];
  payment_requirements: string[];
  extensions: Record<string, any>;
}

export interface StoreAPICartItem {
  key: string;
  id: number;
  quantity: number;
  quantity_limits: {
    minimum: number;
    maximum: number;
    multiple_of: number;
    editable: boolean;
  };
  name: string;
  short_description: string;
  description: string;
  sku: string;
  low_stock_remaining: number | null;
  backorders_allowed: boolean;
  show_backorder_badge: boolean;
  sold_individually: boolean;
  permalink: string;
  images: Array<{
    id: number;
    src: string;
    thumbnail: string;
    srcset: string;
    sizes: string;
    name: string;
    alt: string;
  }>;
  variation: Array<{
    attribute: string;
    value: string;
  }>;
  item_data: any[];
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    price_range: any;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
    raw_prices: {
      precision: number;
      price: string;
      regular_price: string;
      sale_price: string;
    };
  };
  totals: {
    line_subtotal: string;
    line_subtotal_tax: string;
    line_total: string;
    line_total_tax: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
  };
  catalog_visibility: string;
  extensions: Record<string, any>;
}

export interface StoreAPICartTotals {
  total_items: string;
  total_items_tax: string;
  total_fees: string;
  total_fees_tax: string;
  total_discount: string;
  total_discount_tax: string;
  total_shipping: string;
  total_shipping_tax: string;
  total_price: string;
  total_tax: string;
  tax_lines: Array<{
    name: string;
    price: string;
    rate: string;
  }>;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface StoreAPICoupon {
  code: string;
  discount_type: string;
  totals: {
    total_discount: string;
    total_discount_tax: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
  };
}

export interface StoreAPIError {
  code: string;
  message: string;
  data?: {
    status: number;
    params?: Record<string, any>;
  };
}

// ==================== CLIENT ====================

export class WooCommerceStoreAPI {
  private baseUrl: string;
  private nonce?: string;
  private headers: Record<string, string>;

  constructor(config: {
    url: string;
    nonce?: string;
  }) {
    // Remove trailing slash and build Store API base URL
    const cleanUrl = config.url.replace(/\/$/, '');
    this.baseUrl = `${cleanUrl}/wp-json/wc/store/v1`;
    this.nonce = config.nonce;

    // Build headers
    this.headers = {
      'Content-Type': 'application/json',
    };

    if (this.nonce) {
      this.headers['Nonce'] = this.nonce;
    }
  }

  /**
   * Make Store API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: StoreAPIError }> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || 'unknown_error',
            message: data.message || 'An unknown error occurred',
            data: data.data,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  /**
   * Add item to cart
   */
  async addItem(productId: number, quantity: number = 1): Promise<{ success: boolean; data?: StoreAPICartResponse; error?: StoreAPIError }> {
    return this.request<StoreAPICartResponse>('/cart/add-item', {
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
  async getCart(): Promise<{ success: boolean; data?: StoreAPICartResponse; error?: StoreAPIError }> {
    return this.request<StoreAPICartResponse>('/cart');
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemKey: string): Promise<{ success: boolean; data?: StoreAPICartResponse; error?: StoreAPIError }> {
    return this.request<StoreAPICartResponse>(`/cart/items/${itemKey}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update item quantity
   */
  async updateItem(itemKey: string, quantity: number): Promise<{ success: boolean; data?: StoreAPICartResponse; error?: StoreAPIError }> {
    return this.request<StoreAPICartResponse>(`/cart/items/${itemKey}`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity,
      }),
    });
  }

  /**
   * Apply coupon to cart
   */
  async applyCoupon(code: string): Promise<{ success: boolean; data?: StoreAPICartResponse; error?: StoreAPIError }> {
    return this.request<StoreAPICartResponse>('/cart/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({
        code,
      }),
    });
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(code: string): Promise<{ success: boolean; data?: StoreAPICartResponse; error?: StoreAPIError }> {
    return this.request<StoreAPICartResponse>('/cart/remove-coupon', {
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
    this.nonce = nonce;
    this.headers['Nonce'] = nonce;
  }

  /**
   * Check if Store API is available
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.request('/cart', { method: 'GET' });
    return result.success || (result.error?.code !== 'network_error');
  }
}
