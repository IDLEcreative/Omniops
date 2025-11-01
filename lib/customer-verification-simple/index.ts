/**
 * Simple Customer Verification System
 */

import type { SimpleVerificationRequest, VerificationLevel } from './types';
import { WooCommerceCustomer } from '../woocommerce-customer';
import { verifyByEmail, verifyByOrderNumber } from './verifiers';
import { logVerification } from './logger';
import { getVerificationPrompt, getCustomerContext } from './prompts';

export class SimpleCustomerVerification {
  /**
   * Verify customer with minimal friction
   * Returns verification level based on provided info
   */
  static async verifyCustomer(
    request: SimpleVerificationRequest,
    domain?: string
  ): Promise<VerificationLevel> {
    const { name, email, orderNumber, postalCode } = request;

    // Count how many pieces of info provided
    const infoProvided = [name, email, orderNumber, postalCode].filter(Boolean).length;

    // No verification needed for general queries
    if (infoProvided === 0) {
      return {
        level: 'none',
        allowedData: ['general_info', 'policies', 'product_info']
      };
    }

    // Try to match with WooCommerce data
    // Try domain-specific client first, fall back to environment
    let wcCustomer = null;
    if (domain) {
      wcCustomer = await WooCommerceCustomer.forDomain(domain);
    }

    // Fall back to environment variables if domain client not available
    if (!wcCustomer) {
      wcCustomer = WooCommerceCustomer.fromEnvironment();
    }

    if (!wcCustomer) {
      return {
        level: 'none',
        allowedData: ['general_info']
      };
    }

    // If email provided, try direct customer lookup
    if (email) {
      const emailVerification = await verifyByEmail(
        wcCustomer,
        email,
        name,
        request.conversationId,
        logVerification
      );

      if (emailVerification) {
        return emailVerification;
      }
    }

    // If order number provided, try order lookup
    if (orderNumber) {
      const orderVerification = await verifyByOrderNumber(
        wcCustomer,
        orderNumber,
        name,
        postalCode,
        request.conversationId,
        email
      );

      if (orderVerification.level !== 'none') {
        if (request.conversationId && orderVerification.customerEmail) {
          await logVerification(request.conversationId, orderVerification.customerEmail, 'order_match');
        }
        return orderVerification;
      }
    }

    // Basic verification if we have name + some info
    if (name && infoProvided >= 2) {
      await logVerification(request.conversationId, email || 'unknown', 'partial_match');
      return {
        level: 'basic',
        allowedData: ['order_status', 'shipping_info']
      };
    }

    return {
      level: 'none',
      allowedData: ['general_info']
    };
  }

  /**
   * Get appropriate response based on verification level
   */
  static getVerificationPrompt = getVerificationPrompt;

  /**
   * Format customer context based on verification level
   */
  static getCustomerContext = getCustomerContext;
}

// Re-export types
export type { SimpleVerificationRequest, VerificationLevel } from './types';
