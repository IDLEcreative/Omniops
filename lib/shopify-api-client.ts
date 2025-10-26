/**
 * Shopify Admin API Client
 * Core client class for making authenticated requests to Shopify Admin REST API
 *
 * @see https://shopify.dev/docs/api/admin-rest
 */

import type { ShopifyConfig } from './shopify-api-types';

/**
 * Base API client for Shopify Admin REST API
 * Handles authentication, request formatting, and error handling
 */
export class ShopifyAPIClient {
  protected shop: string;
  protected accessToken: string;
  protected apiVersion: string;
  protected baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.shop = config.shop;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '2025-01';
    this.baseUrl = `https://${this.shop}/admin/api/${this.apiVersion}`;
  }

  /**
   * Make authenticated request to Shopify API
   * @param endpoint - API endpoint path (e.g., '/products.json')
   * @param options - Fetch request options
   * @returns Parsed JSON response
   * @throws Error if request fails
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Build query string from parameters object
   * @param params - Key-value pairs for query parameters
   * @returns URLSearchParams object
   */
  protected buildQueryParams(params?: Record<string, unknown>): URLSearchParams {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return queryParams;
  }
}
