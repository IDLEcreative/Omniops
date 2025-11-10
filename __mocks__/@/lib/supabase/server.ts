// Mock for @/lib/supabase/server
// This mock is automatically loaded via Jest's moduleNameMapper

// Create a comprehensive Supabase client mock with Realtime support
const createMockSupabaseClient = () => ({
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  // Supabase Realtime methods
  channel: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue('ok'),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnValue('ok'),
    on: jest.fn().mockReturnThis(),
  }),
  removeChannel: jest.fn().mockResolvedValue('ok'),
  removeAllChannels: jest.fn().mockResolvedValue([]),
});

// Export mock functions - tests can reconfigure these in beforeEach
const createClient = jest.fn();
const createServerClient = jest.fn();
const createServiceClient = jest.fn();
const createServiceRoleClient = jest.fn();
const createServiceRoleClientSync = jest.fn();
const requireClient = jest.fn();
const requireServiceRoleClient = jest.fn();
const validateSupabaseEnv = jest.fn();

// Set default implementations
createClient.mockResolvedValue(createMockSupabaseClient());
createServerClient.mockResolvedValue(createMockSupabaseClient());
createServiceClient.mockResolvedValue(createMockSupabaseClient());
createServiceRoleClient.mockResolvedValue(createMockSupabaseClient());
createServiceRoleClientSync.mockReturnValue(createMockSupabaseClient());
requireClient.mockResolvedValue(createMockSupabaseClient());
requireServiceRoleClient.mockResolvedValue(createMockSupabaseClient());
validateSupabaseEnv.mockReturnValue(true);

// Export all functions
export {
  createClient,
  createServerClient,
  createServiceClient,
  createServiceRoleClient,
  createServiceRoleClientSync,
  requireClient,
  requireServiceRoleClient,
  validateSupabaseEnv,
};
