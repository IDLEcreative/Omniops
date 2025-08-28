// Re-export Supabase utilities from a single file at the lib level
// This helps with module resolution issues on Vercel

// Client exports
export { createClient as createSupabaseClient } from './supabase/client';

// Server exports
export { 
  createClient as createSupabaseServerClient,
  createServiceRoleClient as createSupabaseServiceRoleClient 
} from './supabase/server';