// Mock for @/lib/autonomous/security/audit-logger

export class AuditLogger {
  constructor(supabaseClient?: any) {
    // Accept supabaseClient but don't use it in mock
  }

  logStep = jest.fn();
  getOperationLogs = jest.fn();
  getOperationSummary = jest.fn();
  getFailedSteps = jest.fn();
  getRecentLogs = jest.fn();
  exportAuditTrail = jest.fn();
  deleteOldLogs = jest.fn();
}