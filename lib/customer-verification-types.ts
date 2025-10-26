/**
 * Customer Verification Types
 *
 * Type definitions and interfaces for customer verification system.
 * Part of the customer verification module refactoring.
 */

export interface VerificationRequest {
  conversationId: string;
  email: string;
  method?: 'email' | 'order' | 'phone';
}

export interface VerificationResult {
  success: boolean;
  message: string;
  verificationId?: string;
  code?: string;
  expiresAt?: Date;
}

export interface VerifyCodeResult {
  verified: boolean;
  message: string;
  customerEmail?: string;
}

export interface VerificationStatusResult {
  isVerified: boolean;
  customerEmail?: string;
  verifiedAt?: Date;
}

export type DataType = 'profile' | 'orders' | 'recent_purchases' | 'order_detail';

export interface CacheOptions {
  conversationId: string;
  customerEmail: string;
  wooCustomerId: number;
  data: any;
  dataType: DataType;
}

export interface AccessLogOptions {
  conversationId: string;
  customerEmail: string;
  wooCustomerId: number | null;
  accessedData: string[];
  reason: string;
  verifiedVia: string;
}

/**
 * Configuration constants for customer verification
 */
export const VERIFICATION_CONFIG = {
  MAX_ATTEMPTS: 3,
  EXPIRY_MINUTES: 15,
  RATE_LIMIT_MINUTES: 15,
} as const;
