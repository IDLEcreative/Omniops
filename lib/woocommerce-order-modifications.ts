/**
 * WooCommerce Order Modification Service
 * Main class for handling customer order modifications
 * Part of modularized order modification system
 */

import { WooCommerceAPI } from './woocommerce-api';
import {
  OrderModificationRequest,
  ModificationResult,
  ModificationStatus,
} from './woocommerce-order-modifications-types';
import {
  detectModificationIntent,
  extractOrderInfo,
  generateConfirmationMessage,
} from './woocommerce-order-modifications-validators';
import {
  cancelOrder,
  updateShippingAddress,
  addOrderNote,
  requestRefund,
  logModification,
  verifyOrderOwnership,
  checkModificationAllowed,
} from './woocommerce-order-modifications-api';

// Re-export types and validators for backward compatibility
export {
  OrderModificationRequest,
  ModificationResult,
  ModificationIntent,
  OrderInfo,
  ModificationStatusCheck,
  ModificationType,
  ModificationStatus,
  MODIFICATION_ALLOWED_STATUSES,
  MODIFICATION_ERRORS,
} from './woocommerce-order-modifications-types';

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
  static detectModificationIntent = detectModificationIntent;

  /**
   * Extract order details from message
   */
  static extractOrderInfo = extractOrderInfo;

  /**
   * Verify customer owns the order
   */
  async verifyOrderOwnership(orderId: number, customerEmail: string): Promise<boolean> {
    return verifyOrderOwnership(this.wc, orderId, customerEmail);
  }

  /**
   * Check if modification is allowed based on order status
   */
  async checkModificationAllowed(
    orderId: number,
    modificationType: any
  ): Promise<{ allowed: boolean; currentStatus: string; reason?: string }> {
    return checkModificationAllowed(this.wc, orderId, modificationType);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(request: OrderModificationRequest): Promise<ModificationResult> {
    return cancelOrder(this.wc, request, this.domain, this.logModification.bind(this));
  }

  /**
   * Update shipping address
   */
  async updateShippingAddress(request: OrderModificationRequest): Promise<ModificationResult> {
    return updateShippingAddress(this.wc, request, this.domain, this.logModification.bind(this));
  }

  /**
   * Add a note to an order
   */
  async addOrderNote(request: OrderModificationRequest): Promise<ModificationResult> {
    return addOrderNote(this.wc, request);
  }

  /**
   * Request a refund
   */
  async requestRefund(request: OrderModificationRequest): Promise<ModificationResult> {
    return requestRefund(this.wc, request, this.domain, this.logModification.bind(this));
  }

  /**
   * Generate confirmation message for modification
   */
  generateConfirmationMessage(
    modificationType: string,
    orderId: number,
    orderDetails: any
  ): string {
    return generateConfirmationMessage(modificationType, orderId, orderDetails);
  }

  /**
   * Log modification attempts for audit trail
   */
  private async logModification(
    request: OrderModificationRequest,
    status: ModificationStatus,
    error?: any
  ): Promise<void> {
    return logModification(request, this.domain, status, error);
  }
}