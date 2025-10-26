/**
 * WooCommerce Agent Tool Integration
 * Provides commerce-specific operations as tools for the chat-intelligent route
 */

import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import type { WooCommerceOperationParams, WooCommerceOperationResult } from './woocommerce-tool-types';
import {
  checkStock,
  getProductDetails,
  checkOrder,
  getShippingInfo,
  checkPrice
} from './woocommerce-tool-operations';

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

      case "get_product_details":
        return await getProductDetails(wc, params);

      case "check_order":
        return await checkOrder(wc, params);

      case "get_shipping_info":
        return await getShippingInfo(wc);

      case "check_price":
        return await checkPrice(wc, params);

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
