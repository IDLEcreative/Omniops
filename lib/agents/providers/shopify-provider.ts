/**
 * Shopify Commerce Provider - AI-optimized header for fast comprehension
 *
 * @purpose Shopify implementation of CommerceProvider interface for AI agent product/order queries
 *
 * @flow
 *   1. Query → lookupProducts(query) OR lookupOrder(orderId)
 *   2. → Fetch from Shopify Admin API (products/orders)
 *   3. → Filter/search products by query string (title match)
 *   4. → Return results with product/order details
 *
 * @keyFunctions
 *   - constructor (line 11): Injects Shopify API client
 *   - lookupOrder (line 13): Find order by ID, email, or order name
 *   - lookupProducts (line ~80): Search products by query (filters by title)
 *
 * @handles
 *   - Product search: Basic text matching on product title
 *   - Order lookup: By order ID, customer email, or order name
 *   - Client-side filtering: Email search (Shopify API doesn't support server-side email filter)
 *   - Error handling: Graceful fallbacks when order not found
 *
 * @returns
 *   - lookupProducts: ProductInfo[] with Shopify product details
 *   - lookupOrder: OrderInfo | null with order details, line items, customer info
 *
 * @dependencies
 *   - ShopifyAPI: Product/order queries via Admin REST API
 *
 * @consumers
 *   - lib/agents/commerce-provider.ts: Used by AI agent to answer commerce queries
 *   - app/api/chat/route.ts: Injected via getCommerceProvider()
 *
 * @totalLines 168
 * @estimatedTokens 850 (without header), 350 (with header - 59% savings)
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
          console.log(`[Shopify Provider] Order ID ${numericId} not found`);
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
          console.log(`[Shopify Provider] Product ID ${numericId} not found`);
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
