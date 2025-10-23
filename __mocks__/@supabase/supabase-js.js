// Mock for @supabase/supabase-js

// Create a chainable query builder mock
class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    // Store the chain state
    this._data = null;
    this._error = null;

    // All methods return this for chaining
    const methods = [
      'select', 'insert', 'update', 'upsert', 'delete',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'is', 'in', 'contains', 'containedBy',
      'range', 'overlaps', 'match', 'not', 'or', 'filter',
      'order', 'limit', 'offset'
    ];

    methods.forEach(method => {
      this[method] = jest.fn().mockReturnThis();
    });

    // Generate realistic default data based on table name
    const defaultData = this._getDefaultDataForTable(table);

    // Terminal methods that resolve the chain
    this.single = jest.fn().mockResolvedValue({ data: this._data || defaultData[0] || null, error: this._error });
    this.maybeSingle = jest.fn().mockResolvedValue({ data: this._data || defaultData[0] || null, error: this._error });
    this.csv = jest.fn().mockResolvedValue({ data: '', error: this._error });
    this.count = jest.fn().mockResolvedValue({ data: { count: defaultData.length }, error: this._error });

    // Default resolution for when no terminal method is called
    this.then = (resolve) => {
      return Promise.resolve({ data: this._data || defaultData, error: this._error }).then(resolve);
    };
  }

  _getDefaultDataForTable(table) {
    // Return realistic mock data based on table name
    switch(table) {
      case 'conversations':
        return [{
          id: 'mock-conv-id',
          session_id: 'mock-session-id',
          created_at: new Date().toISOString()
        }];
      case 'messages':
        return [];
      case 'domains':
        return [{
          id: 'mock-domain-id'
        }];
      case 'organization_members':
        return [{
          role: 'owner',
          joined_at: '2025-01-01T00:00:00Z',
          organization: {
            id: 'org-1',
            name: 'Test Organization',
            slug: 'test-org',
            settings: {},
            plan_type: 'free',
            seat_limit: 5,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }
        }];
      case 'organizations':
        return [];  // Empty by default for existence checks
      default:
        return [];
    }
  }
  
  // Allow tests to set mock data
  _setMockData(data) {
    this._data = data;
    this.single.mockResolvedValue({ data, error: null });
    this.maybeSingle.mockResolvedValue({ data, error: null });
    return this;
  }
  
  _setMockError(error) {
    this._error = error;
    this.single.mockResolvedValue({ data: null, error });
    this.maybeSingle.mockResolvedValue({ data: null, error });
    return this;
  }
}

const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn().mockResolvedValue({ 
      data: { user: null, session: null }, 
      error: null 
    }),
    signUp: jest.fn().mockResolvedValue({ 
      data: { user: null, session: null }, 
      error: null 
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    }),
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          role: 'authenticated'
        }
      },
      error: null
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    updateUser: jest.fn().mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ 
      data: null, 
      error: null 
    }),
    refreshSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),
    setSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null
    })
  },
  from: jest.fn((table) => new MockQueryBuilder(table)),
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ 
        data: { path: 'test/path' }, 
        error: null 
      }),
      download: jest.fn().mockResolvedValue({ 
        data: new Blob(), 
        error: null 
      }),
      remove: jest.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      }),
      list: jest.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      }),
      getPublicUrl: jest.fn().mockReturnValue({ 
        data: { publicUrl: 'https://example.com/file' } 
      }),
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed-url' },
        error: null
      })
    }),
  },
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }),
  realtime: {
    channels: [],
    setAuth: jest.fn(),
    removeChannel: jest.fn(),
    removeAllChannels: jest.fn(),
  }
};

export const createClient = jest.fn().mockImplementation(() => mockSupabaseClient);

export const SupabaseClient = jest.fn().mockImplementation(() => mockSupabaseClient);

// Expose testing hooks
export const _mockSupabaseClient = mockSupabaseClient;
export { MockQueryBuilder };
globalThis.__SUPABASE_MOCK__ = mockSupabaseClient;

// Default export
export default {
  createClient,
  SupabaseClient,
  _mockSupabaseClient,
  MockQueryBuilder
};