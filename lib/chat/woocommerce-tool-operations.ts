/**
 * WooCommerce Tool Operations
 * Core WooCommerce operation handlers
 */

import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  ProductDetails
} from './woocommerce-tool-types';
import {
  formatStockMessage,
  extractStockInfo,
  formatOrderMessage,
  extractOrderInfo,
  formatPriceMessage,
  extractPriceInfo
} from './woocommerce-tool-formatters';

/**
 * Check stock status for a product
 */
export async function checkStock(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.productId) {
    return {
      success: false,
      data: null,
      message: "Product ID is required for stock checking"
    };
  }

  try {
    const products = await wc.getProducts({
      sku: params.productId,
      per_page: 1
    });

    if (products && products.length > 0) {
      const product = products[0];
      if (!product) {
        return {
          success: false,
          data: null,
          message: "Product data not available"
        };
      }

      const stockInfo = extractStockInfo(product, params.includeQuantity || false);
      const message = formatStockMessage(product, params.includeQuantity || false);

      return {
        success: true,
        data: stockInfo,
        message
      };
    } else {
      return {
        success: false,
        data: null,
        message: `No product found with ID/SKU: ${params.productId}`
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Stock check error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to check stock status"
    };
  }
}

/**
 * Get detailed product information
 */
export async function getProductDetails(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.productId) {
    return {
      success: false,
      data: null,
      message: "Product ID is required"
    };
  }

  try {
    const products = await wc.getProducts({
      sku: params.productId,
      per_page: 1
    });

    if (products && products.length > 0) {
      const product = products[0];
      if (!product) {
        return {
          success: false,
          data: null,
          message: "Product data not available"
        };
      }

      const productDetails: ProductDetails = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price || product.regular_price,
        salePrice: product.sale_price,
        description: product.description,
        shortDescription: product.short_description,
        categories: product.categories,
        images: product.images,
        stockStatus: product.stock_status,
        permalink: product.permalink,
        attributes: product.attributes,
        variations: product.variations
      };

      return {
        success: true,
        data: productDetails,
        message: `Found product: ${product.name}`
      };
    } else {
      return {
        success: false,
        data: null,
        message: `No product found with ID/SKU: ${params.productId}`
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Product details error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to get product details"
    };
  }
}

/**
 * Check order status
 */
export async function checkOrder(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.orderId && !params.email) {
    return {
      success: false,
      data: null,
      message: "Order ID or email is required for order lookup"
    };
  }

  try {
    let order = null;

    // Try to get order by ID first
    if (params.orderId) {
      const numericId = parseInt(params.orderId, 10);
      if (!isNaN(numericId)) {
        try {
          order = await wc.getOrder(numericId);
        } catch (error) {
          // Order not found by ID, will try email search
          console.log(`[WooCommerce Agent] Order ID ${numericId} not found`);
        }
      }
    }

    // If not found by ID, try searching by order number or email
    if (!order && (params.orderId || params.email)) {
      const searchTerm = params.email || params.orderId;
      const orders = await wc.getOrders({
        search: searchTerm,
        per_page: 1,
      });

      if (orders && orders.length > 0) {
        order = orders[0];
      }
    }

    if (!order) {
      return {
        success: false,
        data: null,
        message: `No order found for ${params.email ? 'email' : 'order ID'}: ${params.email || params.orderId}`
      };
    }

    const orderInfo = extractOrderInfo(order);
    const message = formatOrderMessage(orderInfo);

    return {
      success: true,
      data: orderInfo,
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Order lookup error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve order information"
    };
  }
}

/**
 * Get shipping information
 */
export async function getShippingInfo(
  wc: any
): Promise<WooCommerceOperationResult> {
  try {
    const shippingZones = await wc.get('shipping/zones');
    return {
      success: true,
      data: shippingZones,
      message: "Retrieved shipping information"
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Failed to get shipping information"
    };
  }
}

/**
 * Check product price
 */
export async function checkPrice(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.productId) {
    return {
      success: false,
      data: null,
      message: "Product ID is required for price checking"
    };
  }

  try {
    const products = await wc.getProducts({
      sku: params.productId,
      per_page: 1
    });

    if (products && products.length > 0) {
      const product = products[0];
      if (!product) {
        return {
          success: false,
          data: null,
          message: "Product data not available"
        };
      }

      const priceInfo = extractPriceInfo(product);
      const message = formatPriceMessage(product);

      return {
        success: true,
        data: priceInfo,
        message
      };
    } else {
      return {
        success: false,
        data: null,
        message: `No product found with ID/SKU: ${params.productId}`
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Failed to check price"
    };
  }
}
