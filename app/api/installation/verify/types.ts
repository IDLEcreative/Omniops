/**
 * Type definitions for installation verification
 */

export interface VerificationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

export interface VerificationResponse {
  success: boolean;
  status: 'pass' | 'fail' | 'warning';
  serverUrl: string;
  domain?: string;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
  checks: VerificationResult[];
  totalDuration: number;
  timestamp: string;
  error?: string;
}

export interface VerificationRequest {
  domain?: string;
}
