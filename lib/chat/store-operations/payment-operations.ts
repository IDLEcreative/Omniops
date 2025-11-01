/**
 * Payment Method Operations
 * Retrieves available payment gateways and configurations
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  PaymentMethodInfo
} from '../woocommerce-tool-types';

/**
 * Get available payment methods
 * Shows all configured payment gateways with capabilities
 */
export async function getPaymentMethods(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    // Get payment gateways
    const gateways = await wc.getPaymentGateways();

    if (!gateways || gateways.length === 0) {
      return {
        success: true,
        data: { methods: [] },
        message: "No payment methods configured"
      };
    }

    // Separate enabled and disabled methods
    const enabled = gateways.filter((g: any) => g.enabled);
    const disabled = gateways.filter((g: any) => !g.enabled);

    // Build message
    let message = `💳 Payment Methods\n\n`;
    message += `Total Methods: ${gateways.length}\n`;
    message += `✅ Enabled: ${enabled.length}\n`;
    message += `❌ Disabled: ${disabled.length}\n\n`;

    // Show enabled methods
    if (enabled.length > 0) {
      message += `✅ Active Payment Methods:\n\n`;
      enabled.forEach((gateway: any, index: number) => {
        message += `${index + 1}. ${gateway.title}\n`;
        message += `   ID: ${gateway.id}\n`;

        if (gateway.description) {
          const desc = gateway.description.replace(/<[^>]*>/g, '').substring(0, 100);
          message += `   ${desc}${gateway.description.length > 100 ? '...' : ''}\n`;
        }

        // Show supported features
        if (gateway.supports && gateway.supports.length > 0) {
          message += `   Supports: ${gateway.supports.join(', ')}\n`;
        }

        // Show additional info
        if (gateway.method_title && gateway.method_title !== gateway.title) {
          message += `   Type: ${gateway.method_title}\n`;
        }

        message += `\n`;
      });
    }

    // Show disabled methods
    if (disabled.length > 0) {
      message += `❌ Disabled Payment Methods:\n\n`;
      disabled.forEach((gateway: any, index: number) => {
        message += `${index + 1}. ${gateway.title} (${gateway.id})\n`;
      });
      message += `\n`;
    }

    // Add helpful note
    message += `💡 Customers can choose from ${enabled.length} payment method${enabled.length !== 1 ? 's' : ''} at checkout.`;

    // Prepare structured data
    const methodList: PaymentMethodInfo[] = gateways.map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.description ? g.description.replace(/<[^>]*>/g, '') : '',
      enabled: g.enabled,
      methodTitle: g.method_title || g.title,
      methodDescription: g.method_description || '',
      supports: g.supports || []
    }));

    return {
      success: true,
      data: {
        methods: methodList,
        enabled: methodList.filter(m => m.enabled),
        disabled: methodList.filter(m => !m.enabled)
      },
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Payment methods error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve payment methods"
    };
  }
}
