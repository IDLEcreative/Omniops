/**
 * WooCommerce Order Types
 * Type definitions for order-related operations
 */

import { BillingInfo } from './shared-types';

// Order item type
export interface OrderItem {
  name: string;
  quantity: number;
  total: string;
}

// Order info type
export interface OrderInfo {
  id: number;
  number: string;
  status: string;
  date: string;
  total: string;
  currency: string;
  items: OrderItem[];
  billing: BillingInfo | null;
  shipping: any;
  trackingNumber: string | null;
  permalink: string | null;
}

// Coupon info type
export interface CouponInfo {
  id: number;
  code: string;
  amount: string;
  discountType: string;
  description: string;
  dateExpires: string | null;
  usageCount: number;
  usageLimit: number | null;
  minimumAmount: string;
  maximumAmount: string;
}

// Refund info type
export interface RefundInfo {
  id: number;
  orderId: number;
  dateCreated: string;
  amount: string;
  reason: string;
  refundedBy: number;
  lineItems: any[];
}

// Order note info type
export interface OrderNoteInfo {
  id: number;
  author: string;
  dateCreated: string;
  note: string;
  customerNote: boolean;
}

// Cancel order info type
export interface CancelOrderInfo {
  orderId: number;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  refundInitiated: boolean;
  cancelledAt: string;
  message: string;
}
