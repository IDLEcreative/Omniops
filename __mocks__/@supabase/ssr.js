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

// Create a single mock client instance (singleton)
const mockClient = {
  auth: {
    getUser: mockGetUser,
    signOut: mockSignOut,
    onAuthStateChange: mockOnAuthStateChange,
  },
};

// Always return the same instance
const createBrowserClient = jest.fn(() => mockClient);

// Export the mock and expose the mock functions for test configuration
module.exports = {
  createBrowserClient,
  __mockGetUser: mockGetUser,
  __mockSignOut: mockSignOut,
  __mockOnAuthStateChange: mockOnAuthStateChange,
};
