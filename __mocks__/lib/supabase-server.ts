// Mock for lib/supabase-server (without @ alias)
// This mock file handles imports that don't use the @ alias

// Create a basic mock Supabase client
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

const mockClient = createMockSupabaseClient();

// Using mockResolvedValue instead of implementation allows tests to override easily
export const createClient = jest.fn().mockResolvedValue(mockClient);
export const createServiceRoleClient = jest.fn().mockResolvedValue(mockClient);
export const requireClient = jest.fn().mockResolvedValue(mockClient);
export const requireServiceRoleClient = jest.fn().mockResolvedValue(mockClient);
export const validateSupabaseEnv = jest.fn(() => true);
