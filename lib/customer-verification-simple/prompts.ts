/**
 * Verification Prompts and Context Generation
 */

import type { VerificationLevel } from './types';
import { WooCommerceCustomer } from '../woocommerce-customer';

export function getVerificationPrompt(level: VerificationLevel): string {
  switch (level.level) {
    case 'full':
      return '';  // No additional prompt needed

    case 'basic':
      return '\nI can help you with your order status. For full account access, please provide your email address as well.';

    case 'none':
      return '\nTo help you with your order, I\'ll need some information to locate it. Please provide:\n- Your name and order number, OR\n- Your email address';
  }
}

export async function getCustomerContext(
  level: VerificationLevel,
  conversationId: string,
  domain?: string
): Promise<string> {
  if (level.level === 'none') {
    return '\nCustomer Status: Not verified. Can only provide general information.';
  }

  if (!level.customerEmail && !level.customerId) {
    return `\nCustomer Status: ${level.level} verification. Access limited to: ${level.allowedData.join(', ')}`;
  }

  // Get customer data based on verification level
  // Try domain-specific client first, fall back to environment
  let wcCustomer = null;
  if (domain) {
    wcCustomer = await WooCommerceCustomer.forDomain(domain);
  }

  // Fall back to environment variables if domain client not available
  if (!wcCustomer) {
    wcCustomer = WooCommerceCustomer.fromEnvironment();
  }

  if (!wcCustomer || !level.customerEmail) {
    return `\nCustomer Status: ${level.level} verification.`;
  }

  // For basic verification, only show limited data
  if (level.level === 'basic') {
    // If we have an email but no customer ID, try to find orders by email
    const orders = level.customerId
      ? await wcCustomer.getCustomerOrders(
          level.customerId,
          1,  // Only most recent order
          conversationId,
          level.customerEmail
        )
      : await wcCustomer.getCustomerOrdersByEmail(
          level.customerEmail,
          1,  // Only most recent order
          conversationId
        );

    if (orders.length > 0) {
      const order = orders[0];
      if (order) {
        return `\nCustomer Order Information:\n- Recent Order: #${order.number}\n- Status: ${order.status}\n- Total: ${order.total}\n\n(For full order history, customer needs to provide email address)`;
      }
    }
  }

  // For full verification, show complete context
  return await wcCustomer.getCustomerContext(level.customerEmail, conversationId);
}
