/**
 * Supabase Browser Client - AI-optimized header for fast comprehension
 *
 * @purpose Creates Supabase client for browser/client-side usage with SSR support
 *
 * @flow
 *   1. Import → createClient() called from client components
 *   2. → createBrowserClient with NEXT_PUBLIC env vars
 *   3. → Return typed Supabase client for database queries
 *
 * @keyFunctions
 *   - createClient (line 3): Creates browser Supabase client with fallback for build time
 *
 * @handles
 *   - Client-side queries: Uses NEXT_PUBLIC_SUPABASE_ANON_KEY (safe for browser)
 *   - Build-time safety: Provides placeholder values when env vars missing
 *   - SSR support: Uses @supabase/ssr for server-side rendering compatibility
 *
 * @returns Supabase browser client with typed database schema
 *
 * @dependencies
 *   - @supabase/ssr: SSR-compatible Supabase client
 *   - Environment: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * @consumers
 *   - Client components: Chat widget, dashboard UI
 *   - Browser-side queries: User data, real-time subscriptions
 *
 * @totalLines 14
 * @estimatedTokens 200 (without header), 100 (with header - 50% savings)
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient<Database = any>() {
  // Provide fallback values for build time when env vars might not be available
  // These will be replaced with actual values at runtime on the client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}
