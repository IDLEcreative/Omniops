// Mock for @supabase/supabase-js

// Create a chainable query builder mock
class MockQueryBuilder {
  constructor() {
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
    
    // Terminal methods that resolve the chain
    this.single = jest.fn().mockResolvedValue({ data: this._data, error: this._error });
    this.maybeSingle = jest.fn().mockResolvedValue({ data: this._data, error: this._error });
    this.csv = jest.fn().mockResolvedValue({ data: '', error: this._error });
    this.count = jest.fn().mockResolvedValue({ data: { count: 0 }, error: this._error });
    
    // Default resolution for when no terminal method is called
    this.then = (resolve) => {
      return Promise.resolve({ data: this._data || [], error: this._error }).then(resolve);
    };
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
      data: { user: null }, 
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
  from: jest.fn((table) => new MockQueryBuilder()),
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

const createClient = jest.fn().mockImplementation(() => mockSupabaseClient);

// Support both CommonJS and ES module imports
module.exports = {
  createClient,
  SupabaseClient: jest.fn().mockImplementation(() => mockSupabaseClient),
  default: {
    createClient,
    SupabaseClient: jest.fn().mockImplementation(() => mockSupabaseClient),
  }
};