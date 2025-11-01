/**
 * Customer Verification Types
 */

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
