/**
 * Shopify Commerce Provider Implementation
 */

import { CommerceProvider, OrderInfo } from '../commerce-provider';
import type { ShopifyAPI } from '@/lib/shopify-api';

export class ShopifyProvider implements CommerceProvider {
  readonly platform = 'shopify';

  constructor(private client: ShopifyAPI) {}

  async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
    const shopify = this.client;

    try {
      let order = null;

      // Try to get order by ID first
      const numericId = parseInt(orderId, 10);
      if (!isNaN(numericId)) {
        try {
          order = await shopify.getOrder(numericId);
        } catch (error) {
        }
      }

      // If not found by ID and we have an email, search by email
      if (!order && email) {
        const orders = await shopify.getOrders({
          limit: 1,
          status: 'any',
        });

        // Filter by email client-side (Shopify REST API doesn't support email search directly)
        order = orders.find(o => o.email === email) || null;
      }

      // If still not found by order number, try searching by order name
      if (!order && orderId) {
        const orders = await shopify.getOrders({
          limit: 50,
          status: 'any',
        });

        // Search by order name (e.g., "#1001")
        order = orders.find(o =>
          o.name === orderId ||
          o.name === `#${orderId}` ||
          o.order_number.toString() === orderId
        ) || null;
      }

      if (!order) {
        return null;
      }

      // Convert to standard OrderInfo format
      return {
        id: order.id,
        number: order.name, // Shopify uses "#1001" format
        status: order.financial_status,
        date: order.created_at,
        total: order.total_price,
        currency: order.currency,
        items: order.line_items?.map(item => ({
          name: item.title,
          quantity: item.quantity,
          total: item.price
        })) || [],
        billing: order.billing_address ? {
          firstName: order.billing_address.first_name || '',
          lastName: order.billing_address.last_name || '',
          email: order.email
        } : undefined,
        shipping: order.shipping_address,
        trackingNumber: null, // Would need to access fulfillments for this
        permalink: null // Shopify doesn't provide public order URLs via REST API
      };
    } catch (error) {
      console.error('[Shopify Provider] Order lookup error:', error);
      return null;
    }
  }

  async searchProducts(query: string, limit: number = 10): Promise<any[]> {
    const shopify = this.client;

    try {
      return await shopify.searchProducts(query, limit);
    } catch (error) {
      console.error('[Shopify Provider] Product search error:', error);
      return [];
    }
  }

  async checkStock(productId: string): Promise<any> {
    const shopify = this.client;

    try {
      // Search by SKU or ID
      const numericId = parseInt(productId, 10);
      let product = null;

      if (!isNaN(numericId)) {
        // Try getting by ID
        try {
          product = await shopify.getProduct(numericId);
        } catch (error) {
        }
      }

      // If not found by ID, search all products and filter by SKU
      if (!product) {
        const products = await shopify.getProducts({ limit: 250 });
        product = products.find(p =>
          p.variants.some(v => v.sku === productId)
        ) || null;
      }

      if (!product) {
        return null;
      }

      // Get the first variant (or the one matching the SKU)
      const variant = product.variants.find(v => v.sku === productId) || product.variants[0];

      if (!variant) {
        return null;
      }

      return {
        productName: product.title,
        sku: variant.sku,
        stockStatus: variant.inventory_quantity > 0 ? 'instock' : 'outofstock',
        stockQuantity: variant.inventory_quantity,
        manageStock: variant.inventory_management !== null,
        backorders: variant.inventory_policy === 'continue' ? 'yes' : 'no'
      };
    } catch (error) {
      console.error('[Shopify Provider] Stock check error:', error);
      return null;
    }
  }

  async getProductDetails(productId: string): Promise<any> {
    const shopify = this.client;

    try {
      const numericId = parseInt(productId, 10);

      if (!isNaN(numericId)) {
        return await shopify.getProduct(numericId);
      }

      // Search by SKU
      const products = await shopify.getProducts({ limit: 250 });
      return products.find(p =>
        p.variants.some(v => v.sku === productId)
      ) || null;
    } catch (error) {
      console.error('[Shopify Provider] Product details error:', error);
      return null;
    }
  }
}
