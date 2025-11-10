// Mock for @/lib/autonomous/core/operation-service

export class OperationService {
  constructor(supabaseClient?: any) {
    // Accept supabaseClient but don't use it in mock
  }

  create = jest.fn();
  get = jest.fn();
  update = jest.fn();
  start = jest.fn();
  updateProgress = jest.fn();
  complete = jest.fn();
  fail = jest.fn();
  list = jest.fn();
  getByWorkflow = jest.fn();
  getStats = jest.fn();
  cleanup = jest.fn();
}

// Export any types that might be imported
export type CreateOperationRequest = any;