// Polyfills for MSW
import './jest.setup.msw'

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { server } from '../__tests__/mocks/server'

// Set test environment
process.env.NODE_ENV = 'test'

// Mock window.matchMedia for component tests (required for shopping components)
// Only mock if window exists (jsdom environment, not Node environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock environment variables (skip for E2E tests that need real connections)
// E2E tests set E2E_TEST=true to bypass mocking
if (!process.env.E2E_TEST) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.ENCRYPTION_KEY = 'test-encryption-key-exactly-32ch'
  process.env.WOOCOMMERCE_URL = 'https://test-store.com'
  process.env.WOOCOMMERCE_CONSUMER_KEY = 'test-consumer-key'
  process.env.REDIS_URL = 'redis://localhost:6379' // Mock Redis URL to trigger mock client
  process.env.WOOCOMMERCE_CONSUMER_SECRET = 'test-consumer-secret'
}

// Mock @/lib/supabase-server FIRST before any imports
jest.mock('@/lib/supabase-server', () => {
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
    console.log('[MOCK] createServiceRoleClient called, returning client with user:', (await currentMockClient.auth.getUser()).data.user?.id);
    return currentMockClient;
  });
  const createClient = jest.fn().mockImplementation(async () => {
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

  return {
    validateSupabaseEnv,
    createServiceRoleClient,
    createClient,
    requireClient,
    requireServiceRoleClient,
    __setMockSupabaseClient,
    __resetMockSupabaseClient,
  };
});

// Also mock @/lib/supabase/server with the same implementation
jest.mock('@/lib/supabase/server', () => jest.requireMock('@/lib/supabase-server'));

// Mock ioredis FIRST to prevent real Redis connections during test imports
jest.mock('ioredis', () => {
  // Import the actual mock implementation from __mocks__/@/lib/redis.js
  // This ensures consistent behavior across all tests
  let mockRedisData = new Map();

  const createMockPipeline = () => {
    let pipelineKey = null;
    let pexpireMs = null;

    const pipeline = {
      get(key) {
        pipelineKey = key;
        return pipeline;
      },
      incr(key) {
        return pipeline;
      },
      pexpire(key, ms) {
        pexpireMs = ms;
        return pipeline;
      },
      async exec() {
        if (!pipelineKey) return null;

        const entry = mockRedisData.get(pipelineKey);

        // Check if entry is expired
        const isExpired = entry && entry.expiry && Date.now() > entry.expiry;
        const currentValue = (entry && !isExpired) ? parseInt(entry.value, 10) : 0;
        const newValue = currentValue + 1;

        // Set expiry: use existing expiry if entry exists and not expired, otherwise use pexpireMs
        let expiry;
        if (entry && !isExpired && entry.expiry) {
          expiry = entry.expiry;
        } else if (pexpireMs !== null) {
          expiry = Date.now() + pexpireMs;
        } else {
          expiry = Date.now() + 60000;
        }

        mockRedisData.set(pipelineKey, {
          value: String(newValue),
          expiry
        });

        return [
          [null, currentValue > 0 ? String(currentValue) : null],
          [null, newValue],
          [null, 1]
        ];
      }
    };

    return pipeline;
  };

  return jest.fn().mockImplementation(() => ({
    // Pipeline support for rate limiting
    pipeline: jest.fn(() => createMockPipeline()),
    pttl: jest.fn().mockResolvedValue(-1),
    ping: jest.fn().mockResolvedValue('PONG'),

    // Basic operations
    get: jest.fn(async (key) => {
      const entry = mockRedisData.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiry) {
        mockRedisData.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn((...keys) => {
      let deleted = 0;
      for (const key of keys) {
        if (mockRedisData.has(key)) {
          mockRedisData.delete(key);
          deleted++;
        }
      }
      return Promise.resolve(deleted);
    }),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    incr: jest.fn(async (key) => {
      const entry = mockRedisData.get(key);
      const currentValue = entry ? parseInt(entry.value, 10) : 0;
      const newValue = currentValue + 1;
      mockRedisData.set(key, {
        value: String(newValue),
        expiry: entry?.expiry ?? (Date.now() + 60000)
      });
      return newValue;
    }),

    // List operations (for queue)
    lpush: jest.fn().mockResolvedValue(1),
    rpush: jest.fn().mockResolvedValue(1),
    lrange: jest.fn().mockResolvedValue([]),

    // Hash operations (for job status)
    hset: jest.fn().mockResolvedValue('OK'),
    hget: jest.fn().mockResolvedValue(null),
    hgetall: jest.fn().mockResolvedValue({}),

    // Pattern matching (for cleanup)
    keys: jest.fn().mockResolvedValue([]),

    // Sorted set operations (for caching)
    zadd: jest.fn().mockResolvedValue(1),
    zcard: jest.fn().mockResolvedValue(0),
    zrange: jest.fn().mockResolvedValue([]),
    zrem: jest.fn().mockResolvedValue(1),
    zremrangebyrank: jest.fn().mockResolvedValue(1),

    // Connection
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    status: 'ready',
  }));
});

// Mock OpenAI to avoid browser detection issues in tests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked response',
              role: 'assistant',
            },
            finish_reason: 'stop',
          }],
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{
          embedding: Array(1536).fill(0.1),
        }],
      }),
    },
  }));
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}))

// Mock Next.js headers and cookies
// IMPORTANT: Next.js 15 made cookies() async, so the mock must return a Promise
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name) => {
      // Return Supabase auth cookies for authenticated tests
      if (name === 'sb-access-token' || name.startsWith('sb-')) {
        return { name, value: 'mock-access-token' };
      }
      return { name, value: 'mock-cookie-value' };
    }),
    getAll: jest.fn(() => [
      // Supabase SSR client expects these cookies for authentication
      { name: 'sb-access-token', value: 'mock-access-token' },
      { name: 'sb-refresh-token', value: 'mock-refresh-token' },
    ]),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn((name) => name.startsWith('sb-')),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
    set: jest.fn(),
    delete: jest.fn(),
    forEach: jest.fn(),
  })),
}))

// Mock recommendation algorithms for testing
jest.mock('@/lib/recommendations/vector-similarity', () => ({
  vectorSimilarityRecommendations: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/lib/recommendations/collaborative-filter', () => ({
  collaborativeFilterRecommendations: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/lib/recommendations/content-filter', () => ({
  contentBasedRecommendations: jest.fn().mockResolvedValue([]),
}))

// Mock follow-ups module for cron job tests
jest.mock('@/lib/follow-ups', () => ({
  sendPendingFollowUps: jest.fn().mockResolvedValue({ sent: 0, failed: 0 }),
}))

// Establish API mocking before all tests (guarded for Node/MSW compatibility)
beforeAll(() => {
  try {
    // Use 'bypass' to allow module-level mocks (OpenAI, Supabase) to work without MSW interception
    // This prevents tests from hanging when unhandled requests occur
    server.listen({ onUnhandledRequest: 'bypass' })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[MSW] Disabled in test environment:', e?.message || e)
  }
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  try { server.resetHandlers() } catch {}
  jest.clearAllMocks()
})

// Clean up after the tests are finished
afterAll(() => { try { server.close() } catch {} })
