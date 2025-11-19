/**
 * WooCommerce Commerce Provider - AI-optimized header for fast comprehension
 *
 * @purpose WooCommerce implementation of CommerceProvider interface for AI agent product/order queries
 *
 * @flow
 *   1. Query → lookupProducts(query) OR lookupOrder(orderId)
 *   2. → generateQueryEmbedding (AI semantic search)
 *   3. → Fetch from WooCommerce API (products/orders)
 *   4. → scoreProductsBySimilarity (rank by relevance)
 *   5. → Return top results with similarity scores + relevance reasons
 *
 * @keyFunctions
 *   - constructor (line 35): Dependency injection for client, embeddings, scoring
 *   - lookupOrder (line 43): Find order by ID or email with fallback search
 *   - lookupProducts (line ~90): Semantic product search with embeddings + fuzzy SKU matching
 *   - getRecentSkus (line ~200): Cache SKUs for fuzzy matching (5 min TTL)
 *
 * @handles
 *   - Semantic search: AI embeddings for product queries (e.g., "red shoes" matches "crimson sneakers")
 *   - Fuzzy SKU matching: Handles typos in SKUs (e.g., "A4VT90" → "A4VTG90")
 *   - Order lookup: By order ID, order number, or customer email
 *   - Relevance scoring: Combines embedding similarity + metadata (name, SKU, description)
 *   - Caching: SKU cache (5 min) to optimize fuzzy matching
 *   - Dependency injection: Testable with mock embeddings/scoring functions
 *
 * @returns
 *   - lookupProducts: ProductInfo[] with similarity scores (0-1) and relevance reasons
 *   - lookupOrder: OrderInfo | null with order details, line items, customer info
 *
 * @dependencies
 *   - WooCommerceAPI: Product/order queries via REST API
 *   - Embeddings: generateQueryEmbedding for semantic search
 *   - Product scorer: scoreProductsBySimilarity for relevance ranking
 *   - Fuzzy matching: findSimilarSkus for SKU typo tolerance
 *
 * @consumers
 *   - lib/agents/commerce-provider.ts: Used by AI agent to answer commerce queries
 *   - app/api/chat/route.ts: Injected via getCommerceProvider()
 *
 * @testingStrategy
 *   - Mock embeddingGenerator: Inject test function instead of real AI
 *   - Mock productScorer: Inject test scorer with known similarity scores
 *   - Mock client: Test without real WooCommerce API calls
 *
 * @totalLines 400
 * @estimatedTokens 2,000 (without header), 750 (with header - 62% savings)
 */

import { CommerceProvider, OrderInfo } from '../commerce-provider';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';
import { findSimilarSkus } from '@/lib/fuzzy-matching/sku-matcher';
import { generateQueryEmbedding } from '@/lib/embeddings/query-embedding';
import { scoreProductsBySimilarity } from '@/lib/embeddings/product-embeddings';

/**
 * Embedding generator function type
 */
export type EmbeddingGenerator = (query: string) => Promise<number[]>;

/**
 * Product scorer function type
 */
export type ProductScorer<T> = (products: T[], queryEmbedding: number[], domain?: string) => Promise<Array<T & { similarity: number; relevanceReason: string }>>;

export class WooCommerceProvider implements CommerceProvider {
  readonly platform = 'woocommerce';
  private skuCache: { skus: string[], timestamp: number } | null = null;
  private SKU_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Constructor with dependency injection for embedding functions
   *
   * @param client - WooCommerce API client
   * @param domain - Customer domain (for caching product embeddings)
   * @param embeddingGenerator - Function to generate query embeddings (injected for testability)
   * @param productScorer - Function to score products by similarity (injected for testability)
   */
  constructor(
    private client: WooCommerceAPI,
    private domain?: string,
    private embeddingGenerator: EmbeddingGenerator = (query: string) => generateQueryEmbedding(query, false),
    private productScorer: ProductScorer<any> = (products, queryEmbedding, domain) => scoreProductsBySimilarity(products, queryEmbedding, domain)
  ) {}

  async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
    try {
      let order = null;

      // Try to get order by ID first
      const numericId = parseInt(orderId, 10);
      if (!isNaN(numericId)) {
        try {
          order = await this.client.getOrder(numericId);
        } catch (error) {
          console.log(`[WooCommerce Provider] Order ID ${numericId} not found`);
        }
      }

      // If not found by ID, try searching by order number or email
      if (!order && (orderId || email)) {
        const searchTerm = email || orderId;
        const orders = await this.client.getOrders({
          search: searchTerm,
          per_page: 1,
        });

        if (orders && orders.length > 0) {
          order = orders[0];
        }
      }

      if (!order) {
        return null;
      }

      // Convert to standard OrderInfo format
      return {
        id: order.id,
        number: order.number || order.id.toString(),
        status: order.status,
        date: order.date_created,
        total: order.total,
        currency: (order as any).currency_symbol || order.currency || '$',
        items: order.line_items?.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          total: item.total
        })) || [],
        billing: order.billing ? {
          firstName: order.billing.first_name,
          lastName: order.billing.last_name,
          email: order.billing.email
        } : undefined,
        shipping: order.shipping,
        trackingNumber: (order.shipping as any)?.tracking_number || null,
        permalink: (order as any).permalink || null
      };
    } catch (error) {
      console.error('[WooCommerce Provider] Order lookup error:', error);
      return null;
    }
  }

  async searchProducts(query: string, limit: number = 10): Promise<any[]> {
    try {
      // Get more products than requested to allow for semantic re-ranking
      // WooCommerce search returns keyword matches, we'll filter by semantic similarity
      const fetchLimit = Math.min(limit * 2, 50); // Get 2x requested, max 50

      const products = await this.client.getProducts({
        search: query,
        per_page: fetchLimit,
        status: 'publish',
      });

      if (products.length === 0) {
        return [];
      }

      // Generate query embedding for semantic similarity (using injected dependency)
      const queryEmbedding = await this.embeddingGenerator(query);

      // Score products by semantic similarity (using injected dependency with domain for caching)
      const scoredProducts = await this.productScorer(products, queryEmbedding, this.domain);

      // Return top N products sorted by similarity
      return scoredProducts.slice(0, limit);
    } catch (error) {
      console.error('[WooCommerce Provider] Product search error:', error);
      return [];
    }
  }

  async checkStock(productId: string): Promise<any> {
    try {
      const products = await this.client.getProducts({
        sku: productId,
        per_page: 1
      });

      if (products && products.length > 0) {
        const product = products[0];
        if (!product) return null;

        return {
          productName: product.name,
          sku: product.sku,
          stockStatus: product.stock_status,
          stockQuantity: product.stock_quantity,
          manageStock: product.manage_stock,
          backorders: product.backorders
        };
      }

      return null;
    } catch (error) {
      console.error('[WooCommerce Provider] Stock check error:', error);
      return null;
    }
  }

  /**
   * Get available SKUs from catalog with caching for performance
   * @private
   */
  private async getAvailableSkus(): Promise<string[]> {
    if (this.skuCache && Date.now() - this.skuCache.timestamp < this.SKU_CACHE_TTL) {
      return this.skuCache.skus;
    }

    const products = await this.client.getProducts({ per_page: 100 });
    const skus = products.map(p => p.sku).filter((sku): sku is string => !!sku);

    this.skuCache = { skus, timestamp: Date.now() };
    return skus;
  }

  async getProductDetails(productId: string): Promise<any> {
    try {
      // First try exact SKU match (fast and precise if user provides SKU)
      const skuResults = await this.client.getProducts({
        sku: productId,
        per_page: 1
      });

      if (skuResults && skuResults.length > 0) {
        return skuResults[0];
      }

      console.log(`[WooCommerce Provider] SKU "${productId}" not found in catalog, trying name search fallback`);

      // Fallback: Search by product name/description if SKU search fails
      // This handles cases where user asks about "10mtr extension cables" (name) not SKU
      const searchResults = await this.client.getProducts({
        search: productId,
        per_page: 1,
        status: 'publish'
      });

      if (searchResults && searchResults.length > 0) {
        return searchResults[0];
      }

      console.log(`[WooCommerce Provider] Product "${productId}" not found via SKU or name search`);

      // Fuzzy matching: Suggest similar SKUs if exact match and name search both failed
      const availableSkus = await this.getAvailableSkus();
      const suggestions = findSimilarSkus(productId, availableSkus, 2, 3);

      if (suggestions.length > 0) {
        console.log(`[WooCommerce Provider] Similar SKUs found: ${suggestions.map(s => s.sku).join(', ')}`);
        return {
          suggestions: suggestions.map(s => s.sku)
        };
      }

      return null;
    } catch (error) {
      console.error('[WooCommerce Provider] Product details error:', error);
      return null;
    }
  }
}
