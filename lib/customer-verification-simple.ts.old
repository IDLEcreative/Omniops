import { createServiceRoleClient } from '@/lib/supabase-server';
import { WooCommerceCustomer } from './woocommerce-customer';

export interface SimpleVerificationRequest {
  conversationId: string;
  name?: string;
  email?: string;
  orderNumber?: string;
  postalCode?: string;
}

export interface VerificationLevel {
  level: 'none' | 'basic' | 'full';
  customerId?: number;
  customerEmail?: string;
  allowedData: string[];
}

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
      const customer = await wcCustomer.searchCustomerByEmail(email, request.conversationId);
      if (customer) {
        // Check if name matches (if provided)
        if (!name || this.nameMatches(name, customer.first_name, customer.last_name)) {
          await this.logVerification(request.conversationId, email, 'email_match');
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
        await this.logVerification(request.conversationId, email, 'email_provided');
        return {
          level: 'full',
          customerEmail: email,
          allowedData: ['orders', 'order_history', 'order_status']
        };
      }
    }

    // If order number provided, try order lookup
    if (orderNumber) {
      const orderVerification = await this.verifyByOrderNumber(
        wcCustomer,
        orderNumber,
        name,
        postalCode,
        request.conversationId,
        email
      );
      
      if (orderVerification.level !== 'none') {
        return orderVerification;
      }
    }

    // Basic verification if we have name + some info
    if (name && infoProvided >= 2) {
      await this.logVerification(request.conversationId, email || 'unknown', 'partial_match');
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
   * Verify using order number + minimal info
   */
  private static async verifyByOrderNumber(
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
        if (conversationId) {
          await this.logVerification(conversationId, order.billing?.email, 'order_match');
        }
        
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

  /**
   * Check if names match (fuzzy matching)
   */
  private static nameMatches(provided: string, firstName?: string, lastName?: string): boolean {
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

  /**
   * Log verification for audit
   */
  private static async logVerification(
    conversationId: string,
    customerEmail: string,
    method: string
  ): Promise<void> {
    const supabase = await createServiceRoleClient();
    
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }
    
    try {
      // Update conversation with verification status
      await supabase
        .from('conversations')
        .update({
          verification_status: 'verified',
          verified_customer_email: customerEmail
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error logging verification:', error);
    }
  }

  /**
   * Get appropriate response based on verification level
   */
  static getVerificationPrompt(level: VerificationLevel): string {
    switch (level.level) {
      case 'full':
        return '';  // No additional prompt needed
      
      case 'basic':
        return '\nI can help you with your order status. For full account access, please provide your email address as well.';
      
      case 'none':
        return '\nTo help you with your order, I\'ll need some information to locate it. Please provide:\n- Your name and order number, OR\n- Your email address';
    }
  }

  /**
   * Format customer context based on verification level
   */
  static async getCustomerContext(
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
}