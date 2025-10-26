/**
 * Privacy dashboard types and interfaces
 */

export type RequestField = 'domain' | 'sessionId' | 'email' | 'confirm';

export type AuditFilterType = 'all' | 'export' | 'delete';

export interface PrivacySettings {
  // Data Retention
  chatRetentionDays: string;
  archiveAfterDays: string;
  autoDeleteInactive: boolean;

  // GDPR Compliance
  cookieConsent: boolean;
  dataProcessingConsent: boolean;
  rightToForgotten: boolean;
  dataPortability: boolean;
  consentRecords: boolean;

  // Security Settings
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  anonymizeIPs: boolean;
  secureHeaders: boolean;
  auditLogging: boolean;

  // Privacy Features
  dataMinimization: boolean;
  pseudonymization: boolean;
  purposeLimitation: boolean;
  storageMinimization: boolean;
}

export interface AuditEntry {
  id: string;
  domain: string;
  request_type: "export" | "delete";
  session_id: string | null;
  email: string | null;
  actor: string | null;
  status: string;
  deleted_count: number | null;
  message: string | null;
  created_at: string;
}

export interface GdprRequestForm {
  domain: string;
  sessionId: string;
  email: string;
  confirm: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  // Data Retention
  chatRetentionDays: "365",
  archiveAfterDays: "90",
  autoDeleteInactive: true,

  // GDPR Compliance
  cookieConsent: true,
  dataProcessingConsent: true,
  rightToForgotten: true,
  dataPortability: true,
  consentRecords: true,

  // Security Settings
  encryptionAtRest: true,
  encryptionInTransit: true,
  anonymizeIPs: true,
  secureHeaders: true,
  auditLogging: true,

  // Privacy Features
  dataMinimization: true,
  pseudonymization: false,
  purposeLimitation: true,
  storageMinimization: true,
};

export const AUDIT_PAGE_SIZE = 25;
export const ACTOR_HEADER = 'dashboard-privacy';
