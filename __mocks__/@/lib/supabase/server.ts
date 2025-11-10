// Mock for @/lib/supabase/server
import { jest } from '@jest/globals';

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

export const createClient = jest.fn().mockResolvedValue(createMockSupabaseClient());
export const createServerClient = jest.fn().mockResolvedValue(createMockSupabaseClient());
export const createServiceClient = jest.fn().mockResolvedValue(createMockSupabaseClient());
export const createServiceRoleClient = jest.fn().mockResolvedValue(createMockSupabaseClient());
export const createServiceRoleClientSync = jest.fn().mockReturnValue(createMockSupabaseClient());
export const requireClient = jest.fn().mockResolvedValue(createMockSupabaseClient());
export const requireServiceRoleClient = jest.fn().mockResolvedValue(createMockSupabaseClient());
export const validateSupabaseEnv = jest.fn().mockReturnValue(true);
