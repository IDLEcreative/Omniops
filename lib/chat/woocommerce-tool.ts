/**
 * WooCommerce Agent Tool Integration
 * Provides commerce-specific operations as tools for the chat-intelligent route
 */

import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { WooCommerceOperationParams, WooCommerceOperationResult } from './woocommerce-tool-types';
import { getCurrency } from '@/lib/woocommerce-currency';
import type { CurrencyData } from '@/lib/woocommerce-types';

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
 * Track WooCommerce operation metrics
 * Non-invasive tracking that doesn't break operations if it fails
 */
async function trackOperationMetrics(metrics: {
  operation: string;
  duration_ms: number;
  success: boolean;
  error_type?: string;
  error_message?: string;
  domain: string;
  customer_config_id?: string;
}) {
  try {
    const supabase = await createServiceRoleClient();
    await supabase
      ?.from('woocommerce_usage_metrics')
      .insert(metrics);
  } catch (error) {
    // Silent fail - metrics tracking should never break operations
    console.error('[Analytics] Failed to track metrics:', error);
  }
}

/**
 * Execute a WooCommerce operation
 * Main entry point for WooCommerce tool execution with analytics tracking
 */
export async function executeWooCommerceOperation(
  operation: string,
  params: WooCommerceOperationParams,
  domain: string
): Promise<WooCommerceOperationResult> {
  const start = Date.now();
  console.log(`[WooCommerce Agent] Executing: ${operation}`, params);

  try {
    // Get customer config ID for analytics
    const supabase = await createServiceRoleClient();
    let config = null;

    if (supabase) {
      const { data } = await supabase
        .from('customer_configs')
        .select('id')
        .eq('domain', domain)
        .single();
      config = data;
    }

    const wc = await getDynamicWooCommerceClient(domain);

    if (!wc) {
      // Track configuration error
      await trackOperationMetrics({
        operation,
        duration_ms: Date.now() - start,
        success: false,
        error_type: 'ConfigurationError',
        error_message: 'WooCommerce not configured',
        domain,
        customer_config_id: config?.id
      });

      return {
        success: false,
        data: null,
        message: "WooCommerce is not configured for this domain"
      };
    }

    // Fetch currency for this domain (cached for 24 hours)
    const currency = await getCurrency(wc, domain);

    // Inject currency into params for all operations
    const enrichedParams = {
      ...params,
      currency: {
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name
      }
    };

    // Route to appropriate operation handler
    let result: WooCommerceOperationResult;

    switch (operation) {
      case "check_stock":
        result = await checkStock(wc, enrichedParams);
        break;

      case "get_stock_quantity":
        result = await getStockQuantity(wc, enrichedParams);
        break;

      case "search_products":
        result = await searchProducts(wc, enrichedParams);
        break;

      case "get_product_details":
        result = await getProductDetails(wc, enrichedParams);
        break;

      case "check_order":
        result = await checkOrder(wc, enrichedParams);
        break;

      case "get_shipping_info":
        result = await getShippingInfo(wc);
        break;

      case "get_shipping_methods":
        result = await getShippingMethods(wc, enrichedParams);
        break;

      case "get_payment_methods":
        result = await getPaymentMethods(wc, enrichedParams);
        break;

      case "check_price":
        result = await checkPrice(wc, enrichedParams);
        break;

      case "get_product_variations":
        result = await getProductVariations(wc, enrichedParams);
        break;

      case "get_product_categories":
        result = await getProductCategories(wc, enrichedParams);
        break;

      case "get_product_reviews":
        result = await getProductReviews(wc, enrichedParams);
        break;

      case "get_low_stock_products":
        result = await getLowStockProducts(wc, enrichedParams);
        break;

      case "validate_coupon":
        result = await validateCoupon(wc, enrichedParams);
        break;

      case "check_refund_status":
        result = await checkRefundStatus(wc, enrichedParams);
        break;

      case "cancel_order":
        result = await cancelOrder(wc, enrichedParams);
        break;

      case "get_customer_orders":
        result = await getCustomerOrders(wc, enrichedParams);
        break;

      case "get_order_notes":
        result = await getOrderNotes(wc, enrichedParams);
        break;

      case "get_customer_insights":
        result = await getCustomerInsights(wc, enrichedParams);
        break;

      case "get_sales_report":
        result = await getSalesReport(wc, enrichedParams);
        break;

      case "add_to_cart":
        result = await addToCart(wc, enrichedParams);
        break;

      case "get_cart":
        result = await getCart(wc, enrichedParams);
        break;

      case "remove_from_cart":
        result = await removeFromCart(wc, enrichedParams);
        break;

      case "update_cart_quantity":
        result = await updateCartQuantity(wc, enrichedParams);
        break;

      case "apply_coupon_to_cart":
        result = await applyCouponToCart(wc, enrichedParams);
        break;

      default:
        result = {
          success: false,
          data: null,
          message: `Unknown operation: ${operation}`
        };
    }

    // Track operation metrics
    await trackOperationMetrics({
      operation,
      duration_ms: Date.now() - start,
      success: result.success,
      domain,
      customer_config_id: config?.id
    });

    // Add currency info to result
    return {
      ...result,
      currency: currency.code,
      currencySymbol: currency.symbol
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Error:', error);

    // Track error metrics
    const supabase = await createServiceRoleClient();
    let config = null;

    if (supabase) {
      const { data } = await supabase
        .from('customer_configs')
        .select('id')
        .eq('domain', domain)
        .single();
      config = data;
    }

    await trackOperationMetrics({
      operation,
      duration_ms: Date.now() - start,
      success: false,
      error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      domain,
      customer_config_id: config?.id
    });

    return {
      success: false,
      data: null,
      message: `WooCommerce operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
