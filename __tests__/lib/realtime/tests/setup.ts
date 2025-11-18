/**
 * Shared test setup for event-aggregator tests
 */

export let mockSupabaseClient: any;

// Create the mock Supabase client first
mockSupabaseClient = {
  from: jest.fn()
};

// Create a mock function that returns the mock client
export const mockCreateServiceRoleClientSync = jest.fn(() => mockSupabaseClient);

export function setupMocks() {
  jest.clearAllMocks();

  // Reset the from mock
  mockSupabaseClient.from.mockReset();

  // Ensure the mock returns our client
  mockCreateServiceRoleClientSync.mockReturnValue(mockSupabaseClient);

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

  return mockSupabaseClient;
}
