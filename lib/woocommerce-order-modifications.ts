import { WooCommerceAPI } from './woocommerce-api';
import { createServiceRoleClient } from '@/lib/supabase-server';

export interface OrderModificationRequest {
  type: 'cancel' | 'update_address' | 'add_note' | 'request_refund';
  orderId: number;
  customerId?: number;
  customerEmail: string;
  conversationId: string;
  domain: string;
  data?: any;
}

export interface ModificationResult {
  success: boolean;
  message: string;
  confirmationRequired?: boolean;
  confirmationData?: any;
  error?: string;
}

// Allowed order statuses for each modification type
const MODIFICATION_ALLOWED_STATUSES = {
  cancel: ['pending', 'processing', 'on-hold'],
  update_address: ['pending', 'processing', 'on-hold'],
  add_note: ['any'], // Notes can be added to any order
  request_refund: ['processing', 'completed', 'on-hold'],
};

export class OrderModificationService {
  private wc: WooCommerceAPI;
  private domain: string;

  constructor(wc: WooCommerceAPI, domain: string) {
    this.wc = wc;
    this.domain = domain;
  }

  /**
   * Analyze message to detect modification intent
   */
  static detectModificationIntent(message: string): {
    type?: 'cancel' | 'update_address' | 'add_note' | 'request_refund';
    confidence: number;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Cancel patterns
    if (/cancel|stop|don't want|changed my mind|no longer need|cancel my order|cancel order/i.test(message)) {
      return { type: 'cancel', confidence: 0.9 };
    }
    
    // Note patterns (check before address since "deliver to back door" should be a note)
    if (/add note|add a note|special instruction|please note|important:|note:|deliver to (back|front|side) door/i.test(message)) {
      return { type: 'add_note', confidence: 0.7 };
    }
    
    // Address update patterns
    if (/(change|update|modify|edit).*(address|shipping)|wrong address|new address|ship to .* address|deliver to .* address/i.test(message)) {
      return { type: 'update_address', confidence: 0.85 };
    }
    
    // Refund patterns
    if (/refund|return|money back|get my money|want a refund|request refund/i.test(message)) {
      return { type: 'request_refund', confidence: 0.85 };
    }
    
    return { confidence: 0 };
  }

  /**
   * Extract order details from message
   */
  static extractOrderInfo(message: string): {
    orderId?: string;
    newAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
    reason?: string;
  } {
    const orderMatch = message.match(/#?(\d{4,})/);
    const orderId = orderMatch ? orderMatch[1] : undefined;
    
    // Extract address components if present
    const newAddress: any = {};
    
    // Try to extract structured address
    const addressMatch = message.match(/(?:ship to|deliver to|new address:?)\s*(.+?)(?:\.|$)/i);
    if (addressMatch) {
      const addressText = addressMatch[1];
      
      // Try to parse US-style address
      const usAddressMatch = addressText?.match(/(\d+\s+[^,]+),?\s*([^,]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/i);
      if (usAddressMatch) {
        newAddress.street = usAddressMatch[1];
        newAddress.city = usAddressMatch[2];
        newAddress.state = usAddressMatch[3];
        newAddress.zip = usAddressMatch[4];
      }
    }
    
    // Extract reason for cancellation/refund
    let reason = '';
    const reasonMatch = message.match(/(?:because|reason:|due to)\s*(.+?)(?:\.|$)/i);
    if (reasonMatch) {
      reason = reasonMatch[1]?.trim() || '';
    }
    
    return {
      orderId,
      newAddress: Object.keys(newAddress).length > 0 ? newAddress : undefined,
      reason
    };
  }

  /**
   * Verify customer owns the order
   */
  async verifyOrderOwnership(orderId: number, customerEmail: string): Promise<boolean> {
    try {
      const order = await this.wc.getOrder(orderId);
      
      // Check if email matches
      if (order.billing?.email?.toLowerCase() === customerEmail.toLowerCase()) {
        return true;
      }
      
      // Also check if customer ID matches (if we have it)
      if (order.customer_id && order.customer_id > 0) {
        const customer = await this.wc.getCustomer(order.customer_id);
        if (customer.email?.toLowerCase() === customerEmail.toLowerCase()) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying order ownership:', error);
      return false;
    }
  }

  /**
   * Check if modification is allowed based on order status
   */
  async checkModificationAllowed(
    orderId: number,
    modificationType: keyof typeof MODIFICATION_ALLOWED_STATUSES
  ): Promise<{ allowed: boolean; currentStatus: string; reason?: string }> {
    try {
      const order = await this.wc.getOrder(orderId);
      const currentStatus = order.status;
      const allowedStatuses = MODIFICATION_ALLOWED_STATUSES[modificationType];
      
      if (allowedStatuses.includes('any')) {
        return { allowed: true, currentStatus };
      }
      
      if (!allowedStatuses.includes(currentStatus)) {
        return {
          allowed: false,
          currentStatus,
          reason: `Order cannot be modified because it is in "${currentStatus}" status. Modifications are only allowed for orders in: ${allowedStatuses.join(', ')}`
        };
      }
      
      return { allowed: true, currentStatus };
    } catch (error) {
      console.error('Error checking modification allowed:', error);
      return {
        allowed: false,
        currentStatus: 'unknown',
        reason: 'Unable to verify order status'
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(request: OrderModificationRequest): Promise<ModificationResult> {
    // Verify ownership
    if (!await this.verifyOrderOwnership(request.orderId, request.customerEmail)) {
      return {
        success: false,
        message: 'You are not authorized to cancel this order. The email address does not match our records.',
        error: 'UNAUTHORIZED'
      };
    }
    
    // Check if cancellation is allowed
    const statusCheck = await this.checkModificationAllowed(request.orderId, 'cancel');
    if (!statusCheck.allowed) {
      return {
        success: false,
        message: statusCheck.reason || 'Order cannot be cancelled at this time.',
        error: 'INVALID_STATUS'
      };
    }
    
    // Log the modification attempt
    await this.logModification(request, 'attempted');
    
    try {
      // Update order status to cancelled
      const updatedOrder = await this.wc.updateOrder(request.orderId, {
        status: 'cancelled',
        customer_note: request.data?.reason || 'Order cancelled by customer request via chat'
      });
      
      // Add a note to the order
      await this.wc.createOrderNote(request.orderId, {
        note: `Order cancelled by customer (${request.customerEmail}) via chat. Reason: ${request.data?.reason || 'Not specified'}`,
        customer_note: true
      });
      
      // Log successful modification
      await this.logModification(request, 'completed');
      
      return {
        success: true,
        message: `Order #${request.orderId} has been successfully cancelled. You will receive a confirmation email shortly.`
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      await this.logModification(request, 'failed', error);
      
      return {
        success: false,
        message: 'There was an error cancelling your order. Please contact customer support.',
        error: 'CANCELLATION_FAILED'
      };
    }
  }

  /**
   * Update shipping address
   */
  async updateShippingAddress(request: OrderModificationRequest): Promise<ModificationResult> {
    // Verify ownership
    if (!await this.verifyOrderOwnership(request.orderId, request.customerEmail)) {
      return {
        success: false,
        message: 'You are not authorized to update this order.',
        error: 'UNAUTHORIZED'
      };
    }
    
    // Check if update is allowed
    const statusCheck = await this.checkModificationAllowed(request.orderId, 'update_address');
    if (!statusCheck.allowed) {
      return {
        success: false,
        message: statusCheck.reason || 'Shipping address cannot be updated at this time.',
        error: 'INVALID_STATUS'
      };
    }
    
    // Validate address data
    if (!request.data?.address || typeof request.data.address !== 'object') {
      return {
        success: false,
        message: 'Please provide the complete new shipping address.',
        error: 'INVALID_ADDRESS'
      };
    }
    
    await this.logModification(request, 'attempted');
    
    try {
      // Update the shipping address
      const shippingUpdate: any = {
        shipping: {
          first_name: request.data.address.first_name || '',
          last_name: request.data.address.last_name || '',
          address_1: request.data.address.address_1 || request.data.address.street || '',
          address_2: request.data.address.address_2 || '',
          city: request.data.address.city || '',
          state: request.data.address.state || '',
          postcode: request.data.address.postcode || request.data.address.zip || '',
          country: request.data.address.country || 'US'
        }
      };
      
      await this.wc.updateOrder(request.orderId, shippingUpdate);
      
      // Add a note about the change
      await this.wc.createOrderNote(request.orderId, {
        note: `Shipping address updated by customer via chat. New address: ${JSON.stringify(shippingUpdate.shipping)}`,
        customer_note: true
      });
      
      await this.logModification(request, 'completed');
      
      return {
        success: true,
        message: `Shipping address for order #${request.orderId} has been updated successfully.`
      };
    } catch (error) {
      console.error('Error updating shipping address:', error);
      await this.logModification(request, 'failed', error);
      
      return {
        success: false,
        message: 'There was an error updating your shipping address. Please contact customer support.',
        error: 'UPDATE_FAILED'
      };
    }
  }

  /**
   * Add a note to an order
   */
  async addOrderNote(request: OrderModificationRequest): Promise<ModificationResult> {
    // Verify ownership
    if (!await this.verifyOrderOwnership(request.orderId, request.customerEmail)) {
      return {
        success: false,
        message: 'You are not authorized to add notes to this order.',
        error: 'UNAUTHORIZED'
      };
    }
    
    if (!request.data?.note) {
      return {
        success: false,
        message: 'Please provide the note you want to add.',
        error: 'MISSING_NOTE'
      };
    }
    
    try {
      await this.wc.createOrderNote(request.orderId, {
        note: `Customer note: ${request.data.note}`,
        customer_note: true
      });
      
      return {
        success: true,
        message: `Your note has been added to order #${request.orderId}.`
      };
    } catch (error) {
      console.error('Error adding order note:', error);
      
      return {
        success: false,
        message: 'There was an error adding your note. Please try again.',
        error: 'NOTE_FAILED'
      };
    }
  }

  /**
   * Request a refund
   */
  async requestRefund(request: OrderModificationRequest): Promise<ModificationResult> {
    // Verify ownership
    if (!await this.verifyOrderOwnership(request.orderId, request.customerEmail)) {
      return {
        success: false,
        message: 'You are not authorized to request a refund for this order.',
        error: 'UNAUTHORIZED'
      };
    }
    
    // Check if refund request is allowed
    const statusCheck = await this.checkModificationAllowed(request.orderId, 'request_refund');
    if (!statusCheck.allowed) {
      return {
        success: false,
        message: statusCheck.reason || 'Refund cannot be requested for this order status.',
        error: 'INVALID_STATUS'
      };
    }
    
    await this.logModification(request, 'attempted');
    
    try {
      // Create a refund request note
      await this.wc.createOrderNote(request.orderId, {
        note: `Customer requested refund via chat. Reason: ${request.data?.reason || 'Not specified'}. Customer email: ${request.customerEmail}`,
        customer_note: false // Internal note for staff
      });
      
      // Add customer-visible note
      await this.wc.createOrderNote(request.orderId, {
        note: 'Your refund request has been received and will be processed within 1-2 business days.',
        customer_note: true
      });
      
      // If auto-refund is enabled and amount is specified
      if (request.data?.autoRefund && request.data?.amount) {
        try {
          const refund = await this.wc.createOrderRefund(request.orderId, {
            amount: request.data.amount.toString(),
            reason: request.data.reason || 'Customer requested via chat'
          });
          
          await this.logModification(request, 'completed');
          
          return {
            success: true,
            message: `Refund of ${request.data.amount} has been processed for order #${request.orderId}. You will receive the funds within 3-5 business days.`
          };
        } catch (refundError) {
          console.error('Auto-refund failed:', refundError);
          // Fall back to manual refund request
        }
      }
      
      await this.logModification(request, 'completed');
      
      return {
        success: true,
        message: `Your refund request for order #${request.orderId} has been submitted. Our team will review it and process the refund within 1-2 business days. You will receive a confirmation email once processed.`
      };
    } catch (error) {
      console.error('Error requesting refund:', error);
      await this.logModification(request, 'failed', error);
      
      return {
        success: false,
        message: 'There was an error submitting your refund request. Please contact customer support.',
        error: 'REFUND_REQUEST_FAILED'
      };
    }
  }

  /**
   * Generate confirmation message for modification
   */
  generateConfirmationMessage(
    modificationType: string,
    orderId: number,
    orderDetails: any
  ): string {
    switch (modificationType) {
      case 'cancel':
        return `Are you sure you want to cancel order #${orderId}? This action cannot be undone. Current order status: ${orderDetails.status}, Total: ${orderDetails.currency_symbol}${orderDetails.total}`;
      
      case 'update_address':
        return `Please confirm the new shipping address for order #${orderId}. Make sure all details are correct as the order may ship soon.`;
      
      case 'request_refund':
        return `You are requesting a refund for order #${orderId} (Total: ${orderDetails.currency_symbol}${orderDetails.total}). Please note that refund processing may take 3-5 business days. Do you want to proceed?`;
      
      default:
        return `Please confirm you want to modify order #${orderId}.`;
    }
  }

  /**
   * Log modification attempts for audit trail
   */
  private async logModification(
    request: OrderModificationRequest,
    status: 'attempted' | 'completed' | 'failed',
    error?: any
  ): Promise<void> {
    try {
      const supabase = await createServiceRoleClient();
      
      if (!supabase) {
        console.error('Database connection unavailable for logging modification');
        return;
      }
      
      await supabase.from('order_modifications_log').insert({
        domain: this.domain,
        order_id: request.orderId,
        customer_email: request.customerEmail,
        conversation_id: request.conversationId,
        modification_type: request.type,
        status,
        error_message: error ? String(error) : null,
        metadata: {
          data: request.data,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log modification:', logError);
      // Don't fail the operation if logging fails
    }
  }
}