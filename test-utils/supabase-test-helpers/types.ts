export interface MockQueryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  upsert: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  like: jest.Mock;
  ilike: jest.Mock;
  is: jest.Mock;
  in: jest.Mock;
  contains: jest.Mock;
  containedBy: jest.Mock;
  rangeGt: jest.Mock;
  rangeGte: jest.Mock;
  rangeLt: jest.Mock;
  rangeLte: jest.Mock;
  rangeAdjacent: jest.Mock;
  overlaps: jest.Mock;
  textSearch: jest.Mock;
  match: jest.Mock;
  not: jest.Mock;
  or: jest.Mock;
  filter: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  range: jest.Mock;
  abortSignal: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  then: jest.Mock;
}

export interface MockSupabaseAuth {
  getUser: jest.Mock;
  getSession: jest.Mock;
  signOut: jest.Mock;
  signInWithPassword: jest.Mock;
  signUp: jest.Mock;
  resetPasswordForEmail: jest.Mock;
  updateUser: jest.Mock;
  setSession: jest.Mock;
  refreshSession: jest.Mock;
}

export interface MockSupabaseStorage {
  from: jest.Mock;
}

export interface MockSupabaseClient {
  from: jest.Mock;
  auth: MockSupabaseAuth;
  storage: MockSupabaseStorage;
  rpc: jest.Mock;
  channel: jest.Mock;
}
