/**
 * WooCommerce Stock Operations
 * Handles stock checking, quantity retrieval, and low stock alerts
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult
} from '../woocommerce-tool-types';
import {
  formatStockMessage,
  extractStockInfo
} from '../woocommerce-tool-formatters';

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
 * Get exact stock quantity for a product
 * Always returns precise inventory numbers when available
 */
export async function getStockQuantity(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  const currencySymbol = getCurrencySymbol(params);
  if (!params.productId) {
    return {
      success: false,
      data: null,
      message: "Product ID or SKU is required for stock quantity check"
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

      // Always extract stock info with quantities
      const stockInfo = extractStockInfo(product, true);

      // Enhanced message with quantity details
      let message = `${product.name} (SKU: ${product.sku}):\n`;

      if (product.manage_stock && product.stock_quantity !== null && product.stock_quantity !== undefined) {
        message += `Stock Level: ${product.stock_quantity} units\n`;
        message += `Status: ${product.stock_status === 'instock' ? 'In Stock' : product.stock_status}\n`;

        // Add low stock warning
        if (product.stock_quantity > 0 && product.stock_quantity <= 5) {
          message += `⚠️ Low stock - only ${product.stock_quantity} remaining!\n`;
        }

        // Add backorder info
        if (product.backorders && product.backorders !== 'no') {
          message += `Backorders: ${product.backorders === 'notify' ? 'Available (notify customer)' : 'Available'}\n`;
        }
      } else {
        message += `Stock Status: ${product.stock_status}\n`;
        message += `Stock Management: Disabled (quantities not tracked)\n`;
      }

      // Add pricing info
      if (product.price) {
        message += `Price: ${currencySymbol}${product.price}`;
        if (product.on_sale && product.sale_price) {
          message += ` (regular: ${currencySymbol}${product.regular_price})`;
        }
      }

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
    console.error('[WooCommerce Agent] Stock quantity check error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to check stock quantity"
    };
  }
}

/**
 * Get low stock products
 * Identifies products that are running low on inventory for reordering
 * Admin-facing tool for inventory management
 */
export async function getLowStockProducts(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    const currencySymbol = getCurrencySymbol(params);
    const threshold = params.threshold || 5;

    // Query parameters
    // Note: WooCommerce API doesn't support orderby='stock_quantity' or manage_stock filter
    // We fetch more products and filter/sort client-side
    const queryParams: any = {
      per_page: 100, // Fetch more products for client-side filtering
      stock_status: 'instock', // Only in-stock products
      orderby: 'date', // Valid orderby parameter
      order: 'desc'
    };

    // Filter by category if provided
    if (params.categoryId) {
      queryParams.category = params.categoryId;
    }

    // Get products
    const products = await wc.getProducts(queryParams);

    if (!products || products.length === 0) {
      return {
        success: true,
        data: { products: [] },
        message: "No products found with stock tracking enabled"
      };
    }

    // Filter by threshold (WooCommerce API doesn't support this param directly)
    const lowStockProducts = products.filter((p: any) =>
      p.manage_stock &&
      p.stock_quantity !== null &&
      p.stock_quantity <= threshold &&
      p.stock_quantity > 0  // Exclude out of stock
    );

    if (lowStockProducts.length === 0) {
      return {
        success: true,
        data: { products: [], threshold },
        message: `✅ No products below ${threshold} units in stock`
      };
    }

    // Build message
    let message = `⚠️ Low Stock Alert (${lowStockProducts.length} products below ${threshold} units)\n\n`;

    // Sort by stock quantity (lowest first)
    lowStockProducts.sort((a: any, b: any) => a.stock_quantity - b.stock_quantity);

    // Group by urgency
    const critical = lowStockProducts.filter((p: any) => p.stock_quantity <= 2);
    const warning = lowStockProducts.filter((p: any) => p.stock_quantity > 2 && p.stock_quantity <= threshold);

    if (critical.length > 0) {
      message += `🔴 CRITICAL (≤2 units): ${critical.length} products\n\n`;
      critical.forEach((product: any, index: number) => {
        message += `${index + 1}. ${product.name}\n`;
        message += `   SKU: ${product.sku}\n`;
        message += `   Stock: ${product.stock_quantity} units\n`;
        message += `   Price: ${currencySymbol}${product.price}\n`;
        if (product.categories && product.categories.length > 0) {
          message += `   Category: ${product.categories[0].name}\n`;
        }
        message += `\n`;
      });
    }

    if (warning.length > 0) {
      message += `⚠️ WARNING (${threshold > 2 ? '3-' + threshold : '≤' + threshold} units): ${warning.length} products\n\n`;
      warning.forEach((product: any, index: number) => {
        message += `${index + 1}. ${product.name}\n`;
        message += `   SKU: ${product.sku}\n`;
        message += `   Stock: ${product.stock_quantity} units\n`;
        message += `   Price: ${currencySymbol}${product.price}\n`;
        if (product.categories && product.categories.length > 0) {
          message += `   Category: ${product.categories[0].name}\n`;
        }
        message += `\n`;
      });
    }

    // Add summary
    message += `📊 Threshold: ${threshold} units\n`;
    if (params.categoryId) {
      message += `🔍 Filtered by category ID: ${params.categoryId}\n`;
    }

    // Prepare structured data
    const productList = lowStockProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stock_quantity,
      price: p.price,
      categories: p.categories,
      urgency: p.stock_quantity <= 2 ? 'critical' : 'warning'
    }));

    return {
      success: true,
      data: {
        products: productList,
        threshold,
        criticalCount: critical.length,
        warningCount: warning.length,
        totalCount: lowStockProducts.length
      },
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Low stock products error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve low stock products"
    };
  }
}
