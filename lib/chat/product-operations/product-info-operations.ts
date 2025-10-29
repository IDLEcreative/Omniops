/**
 * WooCommerce Product Information Operations
 * Handles product details and pricing information retrieval
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  ProductDetails
} from '../woocommerce-tool-types';
import {
  formatPriceMessage,
  extractPriceInfo
} from '../woocommerce-tool-formatters';

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
