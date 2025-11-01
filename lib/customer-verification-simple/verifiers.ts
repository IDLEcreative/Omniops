/**
 * Customer Verification Logic
 */

import type { VerificationLevel } from './types';
import { WooCommerceCustomer } from '../woocommerce-customer';

export async function verifyByEmail(
  wcCustomer: WooCommerceCustomer,
  email: string,
  name: string | undefined,
  conversationId: string,
  logVerification: (conversationId: string, email: string, method: string) => Promise<void>
): Promise<VerificationLevel | null> {
  const customer = await wcCustomer.searchCustomerByEmail(email, conversationId);

  if (customer) {
    // Check if name matches (if provided)
    if (!name || nameMatches(name, customer.first_name, customer.last_name)) {
      await logVerification(conversationId, email, 'email_match');
      return {
        level: 'full',
        customerId: customer.id,
        customerEmail: customer.email,
        allowedData: ['orders', 'account', 'personal_info', 'order_history']
      };
    }
  } else {
    // No customer found, but we have an email - still allow order lookup
    // This handles guest checkouts or cases where customer records don't exist
    await logVerification(conversationId, email, 'email_provided');
    return {
      level: 'full',
      customerEmail: email,
      allowedData: ['orders', 'order_history', 'order_status']
    };
  }

  return null;
}

export async function verifyByOrderNumber(
  wcCustomer: WooCommerceCustomer,
  orderNumber: string,
  name?: string,
  postalCode?: string,
  conversationId?: string,
  email?: string
): Promise<VerificationLevel> {
  try {
    // Search for the order
    const wc = (wcCustomer as any).wc;
    const orders = await wc.getOrders({
      search: orderNumber,
      per_page: 1
    });

    if (orders.length === 0) {
      return { level: 'none', allowedData: ['general_info'] };
    }

    const order = orders[0];
    let verificationScore = 0;

    // Check email match (strongest verification)
    if (email && order.billing?.email) {
      if (order.billing.email.toLowerCase() === email.toLowerCase()) {
        verificationScore += 3; // Email match is strong verification
      }
    }

    // Check name match
    if (name) {
      const billingName = `${order.billing?.first_name} ${order.billing?.last_name}`.toLowerCase();
      const shippingName = `${order.shipping?.first_name} ${order.shipping?.last_name}`.toLowerCase();
      if (billingName.includes(name.toLowerCase()) || shippingName.includes(name.toLowerCase())) {
        verificationScore += 2;
      }
    }

    // Check postal code match
    if (postalCode) {
      if (order.billing?.postcode === postalCode || order.shipping?.postcode === postalCode) {
        verificationScore += 2;
      }
    }

    // Determine verification level based on score
    if (verificationScore >= 2) {
      return {
        level: verificationScore >= 3 ? 'full' : 'basic',
        customerId: order.customer_id,
        customerEmail: order.billing?.email,
        allowedData: verificationScore >= 3
          ? ['orders', 'account', 'personal_info', 'order_history']
          : ['order_status', 'shipping_info', 'order_details']
      };
    }
  } catch (error) {
    console.error('Order verification error:', error);
  }

  return { level: 'none', allowedData: ['general_info'] };
}

export function nameMatches(provided: string, firstName?: string, lastName?: string): boolean {
  if (!firstName && !lastName) return false;

  const fullName = `${firstName || ''} ${lastName || ''}`.toLowerCase().trim();
  const providedLower = provided.toLowerCase().trim();

  // Exact match
  if (fullName === providedLower) return true;

  // Last name only match
  if (lastName && lastName.toLowerCase() === providedLower) return true;

  // Partial match (contains)
  if (fullName.includes(providedLower) || providedLower.includes(fullName)) return true;

  return false;
}
