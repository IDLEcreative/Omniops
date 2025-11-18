/**
 * Look up order information from commerce provider
 */

import { SearchResult } from '@/types';
import { normalizeDomain } from './domain-utils';
import type { ToolDependencies, ToolResult } from './types';

export async function executeLookupOrder(
  orderId: string,
  domain: string,
  deps: Pick<ToolDependencies, 'getCommerceProvider'>
): Promise<ToolResult> {
  const { getCommerceProvider: getProviderFn } = deps;

  try {
    const browseDomain = normalizeDomain(domain);

    if (!browseDomain) {
      return { success: false, results: [], source: 'invalid-domain' };
    }

    // Use commerce provider abstraction for multi-platform support
    const provider = await getProviderFn(browseDomain);

    if (!provider) {
      return {
        success: false,
        results: [],
        source: 'no-provider'
      };
    }

    const order = await provider.lookupOrder(orderId);

    if (!order) {
      return {
        success: false,
        results: [],
        source: provider.platform
      };
    }


    // Format order information as a search result
    const itemsList = order.items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ');
    const orderInfo = `Order #${order.number}
Status: ${order.status}
Date: ${order.date}
Total: ${order.currency}${order.total}
Items: ${itemsList || 'No items'}
${order.billing ? `Customer: ${order.billing.firstName} ${order.billing.lastName}` : ''}
${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}`;

    const result: SearchResult = {
      content: orderInfo,
      url: order.permalink || '',
      title: `Order #${order.number}`,
      similarity: 1.0
    };

    return {
      success: true,
      results: [result],
      source: provider.platform
    };

  } catch (error) {
    console.error('[Function Call] lookup_order error:', error);
    return {
      success: false,
      results: [],
      source: 'error'
    };
  }
}
