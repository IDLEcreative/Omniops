import { jest } from '@jest/globals';

/**
 * Creates a properly configured mock Supabase client for testing
 */
export function mockSupabaseClient(overrides?: any): any {
  const defaultClient = {
    auth: {
      signInWithPassword: jest.fn<any>().mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          session: { access_token: 'test-token', refresh_token: 'refresh-token' }
        },
        error: null
      }),
      signUp: jest.fn<any>().mockResolvedValue({
        data: {
          user: { id: 'new-user-id', email: 'new@example.com' },
          session: null
        },
        error: null
      }),
      signOut: jest.fn<any>().mockResolvedValue({ error: null }),
      getSession: jest.fn<any>().mockResolvedValue({
        data: {
          session: { access_token: 'test-token', refresh_token: 'refresh-token' }
        },
        error: null
      }),
      getUser: jest.fn<any>().mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com' }
        },
        error: null
      }),
      onAuthStateChange: jest.fn<any>().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: jest.fn<any>(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
      then: jest.fn<any>().mockResolvedValue({ data: [], error: null }),
    })),
    rpc: jest.fn<any>().mockResolvedValue({ data: [], error: null }),
    storage: {
      from: jest.fn<any>().mockReturnValue({
        upload: jest.fn<any>().mockResolvedValue({
          data: { path: 'test/path' },
          error: null
        }),
        getPublicUrl: jest.fn<any>().mockReturnValue({
          data: { publicUrl: 'https://example.com/file' }
        }),
      }),
    },
  };

  return { ...defaultClient, ...overrides };
}
