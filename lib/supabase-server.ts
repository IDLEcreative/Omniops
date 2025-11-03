// Server-side Supabase exports only
// This file should only be imported in server components and API routes
export {
  createClient,
  createServiceRoleClient,
  createServiceRoleClientSync,
  requireClient,
  requireServiceRoleClient,
  validateSupabaseEnv
} from './supabase/server';