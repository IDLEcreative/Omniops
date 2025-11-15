// Mock for @supabase/ssr
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null }, error: null });
const mockSignOut = jest.fn().mockResolvedValue({ error: null });
const mockOnAuthStateChange = jest.fn(() => ({
  data: {
    subscription: {
      unsubscribe: jest.fn(),
    },
  },
}));

// Create a comprehensive mock Supabase client
const createMockClient = () => ({
  auth: {
    getUser: mockGetUser,
    signOut: mockSignOut,
    onAuthStateChange: mockOnAuthStateChange,
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
  channel: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue('ok'),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnValue('ok'),
    on: jest.fn().mockReturnThis(),
  }),
  removeChannel: jest.fn().mockResolvedValue('ok'),
  removeAllChannels: jest.fn().mockResolvedValue([]),
});

// Browser and server clients
const createBrowserClient = jest.fn(() => createMockClient());
const createServerClient = jest.fn(() => createMockClient());

// Export the mock and expose the mock functions for test configuration
module.exports = {
  createBrowserClient,
  createServerClient,
  __mockGetUser: mockGetUser,
  __mockSignOut: mockSignOut,
  __mockOnAuthStateChange: mockOnAuthStateChange,
};
