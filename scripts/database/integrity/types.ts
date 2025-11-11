export interface IntegrityIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  table?: string;
  issue: string;
  count?: number;
  details?: unknown;
  recommendation: string;
}
