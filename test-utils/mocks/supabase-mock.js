/**
 * Supabase Mock Configuration
 *
 * Provides comprehensive mock implementations for Supabase client and server.
 * Used across all test files to avoid real database connections.
 */

// Create a comprehensive chainable Supabase query builder mock
const createChainableBuilder = () => {
  const builder = {
    // Data manipulation - each returns builder for chaining
    select: jest.fn(function() { return this; }),
    insert: jest.fn(function() { return this; }),
    update: jest.fn(function() { return this; }),
    delete: jest.fn(function() { return this; }),
    upsert: jest.fn(function() { return this; }),

    // Filters - each returns builder for chaining
    eq: jest.fn(function() { return this; }),
    neq: jest.fn(function() { return this; }),
    gt: jest.fn(function() { return this; }),
    gte: jest.fn(function() { return this; }),
    lt: jest.fn(function() { return this; }),
    lte: jest.fn(function() { return this; }),
    like: jest.fn(function() { return this; }),
    ilike: jest.fn(function() { return this; }),
    is: jest.fn(function() { return this; }),
    in: jest.fn(function() { return this; }),
    contains: jest.fn(function() { return this; }),
    containedBy: jest.fn(function() { return this; }),

    // Logical operators - each returns builder for chaining
    or: jest.fn(function() { return this; }),
    and: jest.fn(function() { return this; }),
    not: jest.fn(function() { return this; }),
    filter: jest.fn(function() { return this; }),

    // Modifiers - each returns builder for chaining
    order: jest.fn(function() { return this; }),
    limit: jest.fn(function() { return this; }),
    range: jest.fn(function() { return this; }),

    // Execution
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),

    // Allow builder to be awaited (acts like a Promise)
    then: jest.fn((resolve) => resolve({ data: null, error: null })),
    catch: jest.fn((reject) => reject({ data: null, error: null })),
  };
  return builder;
};

const createMockSupabaseClient = () => ({
  from: jest.fn(() => createChainableBuilder()),
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  auth: {
    // User session methods
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),

    // Admin methods
    admin: {
      createUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      deleteUser: jest.fn().mockResolvedValue({ data: null, error: null }),
      updateUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      getUserById: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      inviteUserByEmail: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
});

// Use a STATE VARIABLE that tests can modify
let currentMockClient = createMockSupabaseClient();

const validateSupabaseEnv = jest.fn().mockReturnValue(true);
const createServiceRoleClient = jest.fn().mockImplementation(async () => {
  if (currentMockClient === null) {
    console.log('[MOCK] createServiceRoleClient called, returning null (database unavailable)');
    return null;
  }
  console.log('[MOCK] createServiceRoleClient called, returning client with user:', (await currentMockClient.auth.getUser()).data.user?.id);
  return currentMockClient;
});
const createClient = jest.fn().mockImplementation(async () => {
  if (currentMockClient === null) {
    console.log('[MOCK] createClient called, returning null (database unavailable)');
    return null;
  }
  const user = await currentMockClient.auth.getUser();
  console.log('[MOCK] createClient called, returning client with user:', user.data.user?.id);
  return currentMockClient;
});
const requireClient = jest.fn().mockImplementation(async () => currentMockClient);
const requireServiceRoleClient = jest.fn().mockImplementation(async () => currentMockClient);

const __setMockSupabaseClient = (customMockClient) => {
  currentMockClient = customMockClient;
};

const __resetMockSupabaseClient = () => {
  currentMockClient = createMockSupabaseClient();
};

// Create independent mock functions for aliases (needed for tests that mock these directly)
const createServerClient = jest.fn().mockImplementation(async () => {
  if (currentMockClient === null) {
    console.log('[MOCK] createServerClient (alias) called, returning null (database unavailable)');
    return null;
  }
  const user = await currentMockClient.auth.getUser();
  console.log('[MOCK] createServerClient (alias) called, returning client with user:', user.data.user?.id);
  return currentMockClient;
});

const createServiceClient = jest.fn().mockImplementation(async () => currentMockClient);

module.exports = {
  validateSupabaseEnv,
  createServiceRoleClient,
  createClient,
  requireClient,
  requireServiceRoleClient,
  __setMockSupabaseClient,
  __resetMockSupabaseClient,
  // Export aliases as independent jest.fn() instances (matches lib/supabase/server.ts)
  createServerClient,
  createServiceClient,
};
