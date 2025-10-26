/**
 * Type definitions and constants for WooCommerce order modifications
 * Part of modularized order modification system
 */

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

export interface OrderInfo {
  orderId?: string;
  newAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  reason?: string;
}

export interface ModificationIntent {
  type?: 'cancel' | 'update_address' | 'add_note' | 'request_refund';
  confidence: number;
}

export interface ModificationStatusCheck {
  allowed: boolean;
  currentStatus: string;
  reason?: string;
}

export type ModificationType = keyof typeof MODIFICATION_ALLOWED_STATUSES;
export type ModificationStatus = 'attempted' | 'completed' | 'failed';

/**
 * Allowed order statuses for each modification type
 */
export const MODIFICATION_ALLOWED_STATUSES = {
  cancel: ['pending', 'processing', 'on-hold'],
  update_address: ['pending', 'processing', 'on-hold'],
  add_note: ['any'], // Notes can be added to any order
  request_refund: ['processing', 'completed', 'on-hold'],
} as const;

/**
 * Pattern definitions for intent detection
 */
export const MODIFICATION_PATTERNS = {
  cancel: /cancel|stop|don't want|changed my mind|no longer need|cancel my order|cancel order/i,
  add_note: /add note|add a note|special instruction|please note|important:|note:|deliver to (back|front|side) door/i,
  update_address: /(change|update|modify|edit).*(address|shipping)|wrong address|new address|ship to .* address|deliver to .* address/i,
  request_refund: /refund|return|money back|get my money|want a refund|request refund/i,
} as const;

/**
 * Regular expressions for data extraction
 */
export const EXTRACTION_PATTERNS = {
  orderId: /#?(\d{4,})/,
  address: /(?:ship to|deliver to|new address:?)\s*(.+?)(?:\.|$)/i,
  usAddress: /(\d+\s+[^,]+),?\s*([^,]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/i,
  reason: /(?:because|reason:|due to)\s*(.+?)(?:\.|$)/i,
} as const;

/**
 * Error codes for modification operations
 */
export const MODIFICATION_ERRORS = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  MISSING_NOTE: 'MISSING_NOTE',
  CANCELLATION_FAILED: 'CANCELLATION_FAILED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  NOTE_FAILED: 'NOTE_FAILED',
  REFUND_REQUEST_FAILED: 'REFUND_REQUEST_FAILED',
} as const;
