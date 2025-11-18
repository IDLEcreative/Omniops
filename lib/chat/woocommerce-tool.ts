/**
 * WooCommerce Agent Tool Integration
 * Main entry point for WooCommerce operations
 */

import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import type { WooCommerceOperationParams, WooCommerceOperationResult } from './woocommerce-tool-types';
import { getCurrency } from '@/lib/woocommerce-currency';
import { trackOperationMetrics, getCustomerConfigId } from './woocommerce-metrics';
import { routeWooCommerceOperation } from './woocommerce-operation-router';

// Re-export types and tool definition
export { WOOCOMMERCE_TOOL } from './woocommerce-tool-types';
export { formatWooCommerceResponse } from './woocommerce-tool-formatters';
export type { WooCommerceOperationParams, WooCommerceOperationResult } from './woocommerce-tool-types';

/**
 * Execute a WooCommerce operation
 * Main entry point for WooCommerce tool execution with analytics tracking
 *
 * Refactored to support optional dependency injection for testing
 *
 * @param operation - Operation type to execute
 * @param params - Operation parameters
 * @param domain - Customer domain
 * @param wcClient - Optional WooCommerce client for testing (if not provided, creates from domain)
 *
 * @example
 * // Production usage
 * const result = await executeWooCommerceOperation('get_products', params, 'example.com');
 *
 * @example
 * // Testing usage
 * const mockClient = createMockWooCommerceClient();
 * const result = await executeWooCommerceOperation('get_products', params, 'example.com', mockClient);
 */
export async function executeWooCommerceOperation(
  operation: string,
  params: WooCommerceOperationParams,
  domain: string,
  wcClient?: any // WooCommerceAPI type - optional for dependency injection
): Promise<WooCommerceOperationResult> {
  const start = Date.now();

  try {
    // Get customer config ID for analytics
    const configId = await getCustomerConfigId(domain);

    // Use injected client if provided (for testing), otherwise create from domain
    const wc = wcClient || await getDynamicWooCommerceClient(domain);

    if (!wc) {
      // Track configuration error
      await trackOperationMetrics({
        operation,
        duration_ms: Date.now() - start,
        success: false,
        error_type: 'ConfigurationError',
        error_message: 'WooCommerce not configured',
        domain,
        customer_config_id: configId || undefined
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
    const result = await routeWooCommerceOperation(operation, enrichedParams, wc);

    // Track operation metrics
    await trackOperationMetrics({
      operation,
      duration_ms: Date.now() - start,
      success: result.success,
      domain,
      customer_config_id: configId || undefined
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
    const configId = await getCustomerConfigId(domain);

    await trackOperationMetrics({
      operation,
      duration_ms: Date.now() - start,
      success: false,
      error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      domain,
      customer_config_id: configId || undefined
    });

    return {
      success: false,
      data: null,
      message: `WooCommerce operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
