// Mock for @/lib/supabase-server

// Create a mock Supabase client with all necessary methods
// Provides sensible defaults that return mock data instead of null
const createMockSupabaseClient = () => ({
  from: jest.fn((table: string) => {
    // Provide table-specific mocks with sensible defaults
    if (table === 'conversations') {
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'mock-conv-id', session_id: 'mock-session-id', created_at: new Date().toISOString() },
              error: null
            })
          })
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'mock-conv-id', session_id: 'mock-session-id' },
              error: null
            })
          })
        })
      };
    }

    if (table === 'messages') {
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      };
    }

    if (table === 'domains') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'mock-domain-id' },
              error: null
            })
          })
        })
      };
    }

    // Default fallback for other tables
    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  }),
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
});

let mockClient = createMockSupabaseClient();

export const validateSupabaseEnv = jest.fn().mockReturnValue(true);

// These must return promises to match the real async functions
// IMPORTANT: Return a fresh client instance each time to avoid stale mock data
// Using mockResolvedValue makes these mocks chainable/reconfigurable in tests
export const createServiceRoleClient = jest.fn().mockResolvedValue(createMockSupabaseClient());

export const createClient = jest.fn().mockResolvedValue(mockClient);

export const requireClient = jest.fn().mockResolvedValue(mockClient);

export const requireServiceRoleClient = jest.fn().mockResolvedValue(mockClient);

// For tests that need to customize the mock
export const __setMockSupabaseClient = (customMockClient: any) => {
  mockClient = customMockClient;
  (createServiceRoleClient as jest.Mock).mockResolvedValue(customMockClient);
  (createClient as jest.Mock).mockResolvedValue(customMockClient);
  (requireClient as jest.Mock).mockResolvedValue(customMockClient);
  (requireServiceRoleClient as jest.Mock).mockResolvedValue(customMockClient);
};

// Reset to default mock
export const __resetMockSupabaseClient = () => {
  mockClient = createMockSupabaseClient();
  (createServiceRoleClient as jest.Mock).mockResolvedValue(mockClient);
  (createClient as jest.Mock).mockResolvedValue(mockClient);
  (requireClient as jest.Mock).mockResolvedValue(mockClient);
  (requireServiceRoleClient as jest.Mock).mockResolvedValue(mockClient);
};

const mockSupabaseServer = {
  validateSupabaseEnv,
  createServiceRoleClient,
  createClient,
  __setMockSupabaseClient,
  __resetMockSupabaseClient
};

export default mockSupabaseServer;
