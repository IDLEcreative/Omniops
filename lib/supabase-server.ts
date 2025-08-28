// Server-side Supabase exports only  
// This file should only be imported in server components and API routes
export { 
  createClient,
  createServiceRoleClient,
  requireClient,
  requireServiceRoleClient,
  validateSupabaseEnv
} from './supabase/server';