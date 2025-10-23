// Mock for @/lib/supabase-server

// Create a mock Supabase client with all necessary methods
const createMockSupabaseClient = () => ({
  from: jest.fn(() => ({
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
  })),
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
});

let mockClient = createMockSupabaseClient();

export const validateSupabaseEnv = jest.fn().mockReturnValue(true);

// These must return promises to match the real async functions
// Using mockResolvedValue instead of implementation allows tests to override easily
export const createServiceRoleClient = jest.fn().mockResolvedValue(mockClient);

export const createClient = jest.fn().mockResolvedValue(mockClient);

export const requireClient = jest.fn().mockResolvedValue(mockClient);

export const requireServiceRoleClient = jest.fn().mockResolvedValue(mockClient);

// For tests that need to customize the mock
export const __setMockSupabaseClient = (customMockClient: any) => {
  mockClient = customMockClient;
  (createServiceRoleClient as jest.Mock).mockReturnValue(customMockClient);
  (createClient as jest.Mock).mockReturnValue(customMockClient);
};

// Reset to default mock
export const __resetMockSupabaseClient = () => {
  mockClient = createMockSupabaseClient();
  (createServiceRoleClient as jest.Mock).mockReturnValue(mockClient);
  (createClient as jest.Mock).mockReturnValue(mockClient);
};

export default {
  validateSupabaseEnv,
  createServiceRoleClient,
  createClient,
  __setMockSupabaseClient,
  __resetMockSupabaseClient
};
