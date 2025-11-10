export const createClient = jest.fn().mockResolvedValue({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  // Supabase Realtime methods
  channel: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue('ok'),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnValue('ok'),
    on: jest.fn().mockReturnThis(),
  }),
  removeChannel: jest.fn().mockResolvedValue('ok'),
  removeAllChannels: jest.fn().mockResolvedValue([]),
})

export const createServiceRoleClient = jest.fn().mockResolvedValue({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    admin: {
      createUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      deleteUser: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  // Supabase Realtime methods
  channel: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue('ok'),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnValue('ok'),
    on: jest.fn().mockReturnThis(),
  }),
  removeChannel: jest.fn().mockResolvedValue('ok'),
  removeAllChannels: jest.fn().mockResolvedValue([]),
})