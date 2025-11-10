/**
 * Autonomous Consent Types
 * Type definitions for consent management system
 */

export interface ConsentRequest {
  service: string;
  operation: string;
  permissions: string[];
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentRecord {
  id: string;
  organizationId: string;
  userId: string | null;
  service: string;
  operation: string;
  permissions: string[];
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  isActive: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  consentVersion: string | null;
  createdAt: string;
}

export interface ConsentVerification {
  hasConsent: boolean;
  consentRecord?: ConsentRecord;
  reason?: string;
}
