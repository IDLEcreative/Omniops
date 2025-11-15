/**
 * Shared types for error analysis
 */

export interface Finding {
  file: string;
  line?: number;
  pattern: string;
  description: string;
  suggestion: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ErrorHandlingReport {
  category: string;
  findings: Finding[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}
