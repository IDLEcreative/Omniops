/**
 * WooCommerce Store API HTTP Client
 */

import type { StoreAPIError, StoreAPIResponse } from './types';

export class StoreAPIClient {
  private baseUrl: string;
  private nonce?: string;
  private headers: Record<string, string>;

  constructor(config: { url: string; nonce?: string }) {
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

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<StoreAPIResponse<T>> {
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

  setNonce(nonce: string): void {
    this.nonce = nonce;
    this.headers['Nonce'] = nonce;
  }

  async isAvailable(): Promise<boolean> {
    const result = await this.request('/cart', { method: 'GET' });
    return result.success || (result.error?.code !== 'network_error');
  }
}
