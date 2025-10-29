/**
 * WooCommerce Agent Tool Integration
 * Provides commerce-specific operations as tools for the chat-intelligent route
 */

import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import type { WooCommerceOperationParams, WooCommerceOperationResult } from './woocommerce-tool-types';

// Product operations
import {
  checkStock,
  getStockQuantity,
  getProductDetails,
  checkPrice,
  getProductCategories,
  getProductReviews,
  getProductVariations,
  getLowStockProducts,
  searchProducts
} from './product-operations';

// Order operations
import {
  checkOrder,
  getShippingInfo,
  getCustomerOrders,
  getOrderNotes,
  checkRefundStatus,
  cancelOrder
} from './order-operations';

// Store configuration operations
import {
  validateCoupon,
  getShippingMethods,
  getPaymentMethods
} from './store-operations';

// Analytics operations
import {
  getCustomerInsights
} from './analytics-operations';

// Report operations
import {
  getSalesReport
} from './report-operations';

// Cart operations
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  applyCouponToCart
} from './cart-operations';

// Re-export types and tool definition
export { WOOCOMMERCE_TOOL } from './woocommerce-tool-types';
export { formatWooCommerceResponse } from './woocommerce-tool-formatters';
export type { WooCommerceOperationParams, WooCommerceOperationResult } from './woocommerce-tool-types';

/**
 * Execute a WooCommerce operation
 * Main entry point for WooCommerce tool execution
 */
export async function executeWooCommerceOperation(
  operation: string,
  params: WooCommerceOperationParams,
  domain: string
): Promise<WooCommerceOperationResult> {
  console.log(`[WooCommerce Agent] Executing: ${operation}`, params);

  try {
    const wc = await getDynamicWooCommerceClient(domain);

    if (!wc) {
      return {
        success: false,
        data: null,
        message: "WooCommerce is not configured for this domain"
      };
    }

    // Route to appropriate operation handler
    switch (operation) {
      case "check_stock":
        return await checkStock(wc, params);

      case "get_stock_quantity":
        return await getStockQuantity(wc, params);

      case "search_products":
        return await searchProducts(wc, params);

      case "get_product_details":
        return await getProductDetails(wc, params);

      case "check_order":
        return await checkOrder(wc, params);

      case "get_shipping_info":
        return await getShippingInfo(wc);

      case "get_shipping_methods":
        return await getShippingMethods(wc, params);

      case "get_payment_methods":
        return await getPaymentMethods(wc, params);

      case "check_price":
        return await checkPrice(wc, params);

      case "get_product_variations":
        return await getProductVariations(wc, params);

      case "get_product_categories":
        return await getProductCategories(wc, params);

      case "get_product_reviews":
        return await getProductReviews(wc, params);

      case "get_low_stock_products":
        return await getLowStockProducts(wc, params);

      case "validate_coupon":
        return await validateCoupon(wc, params);

      case "check_refund_status":
        return await checkRefundStatus(wc, params);

      case "cancel_order":
        return await cancelOrder(wc, params);

      case "get_customer_orders":
        return await getCustomerOrders(wc, params);

      case "get_order_notes":
        return await getOrderNotes(wc, params);

      case "get_customer_insights":
        return await getCustomerInsights(wc, params);

      case "get_sales_report":
        return await getSalesReport(wc, params);

      case "add_to_cart":
        return await addToCart(wc, params);

      case "get_cart":
        return await getCart(wc, params);

      case "remove_from_cart":
        return await removeFromCart(wc, params);

      case "update_cart_quantity":
        return await updateCartQuantity(wc, params);

      case "apply_coupon_to_cart":
        return await applyCouponToCart(wc, params);

      default:
        return {
          success: false,
          data: null,
          message: `Unknown operation: ${operation}`
        };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Error:', error);
    return {
      success: false,
      data: null,
      message: `WooCommerce operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
