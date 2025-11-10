/**
 * Audit Logger Types
 * @module lib/autonomous/security/audit-logger-types
 */

export interface AuditStepData {
  operationId: string;
  stepNumber: number;
  intent: string;
  action: string;
  success: boolean;
  error?: string;
  screenshotUrl?: string;
  pageUrl?: string;
  durationMs?: number;
  aiResponse?: Record<string, any>;
}

export interface AuditRecord {
  id: string;
  operationId: string;
  stepNumber: number;
  intent: string;
  action: string;
  success: boolean;
  error: string | null;
  screenshotUrl: string | null;
  pageUrl: string | null;
  durationMs: number | null;
  aiResponse: Record<string, any> | null;
  timestamp: string;
}

export interface OperationSummary {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalDurationMs: number;
  avgStepDurationMs: number;
  screenshots: string[];
}
