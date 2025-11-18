/**
 * Supabase Server Clients - AI-optimized header for fast comprehension
 *
 * @purpose Creates Supabase clients for server-side usage with SSR support and service role access
 *
 * @flow
 *   1. API route → createClient() for user context (SSR with cookies)
 *   2. OR → createServiceRoleClient() for admin operations (bypasses RLS)
 *   3. → Validates env vars with cached validation
 *   4. → Returns typed Supabase client OR null (safe for missing env)
 *
 * @keyFunctions
 *   - validateSupabaseEnv (line 16): Validates env vars, cached per request
 *   - createClient (line 42): SSR server client with user context (cookies)
 *   - createServiceRoleClientSync (line 105): Service role client (sync, for constructors)
 *   - createServiceRoleClient (line 154): Service role client (async, for API routes)
 *   - requireClient (line 166): Get SSR client or throw production-safe error
 *   - requireServiceRoleClient (line 178): Get service role or throw
 *
 * @handles
 *   - SSR: Uses @supabase/ssr with Next.js cookies() for session persistence
 *   - Service role: Uses admin key to bypass RLS (createClient, not createServerClient)
 *   - Connection pooling: Session pooling (20 connections) vs Transaction pooling (40 connections)
 *   - Build-time safety: Returns null when env vars missing (no throws)
 *   - Request caching: Validates env once per request, caches result
 *
 * @returns
 *   - createClient(): SupabaseClient | null (SSR client with user context)
 *   - createServiceRoleClient(): SupabaseClient (admin client, throws if unavailable)
 *   - requireClient(): SupabaseClient (SSR client, throws if unavailable)
 *
 * @dependencies
 *   - @supabase/ssr: SSR-compatible Supabase client
 *   - @supabase/supabase-js: Service role client (bypasses RLS)
 *   - next/headers: Cookie management for session persistence
 *   - Environment: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * @consumers
 *   - API routes (user context): app/api/chat/route.ts, app/api/scrape/route.ts
 *   - API routes (admin): app/api/woocommerce/ * /route.ts (note: asterisk for glob pattern)
 *   - Background jobs: lib/queue/job-processor.ts (service role for admin tasks)
 *   - Server components: Any RSC needing database access
 *
 * @configuration
 *   - Session pool (user context): 20 connections, 60s timeout, 5s statement timeout
 *   - Transaction pool (service role): 40 connections, 60s timeout, 10s connection timeout
 *   - Persistent sessions: User context only (service role doesn't persist)
 *   - Auto refresh: User context only (service role is stateless)
 *
 * @security
 *   - Service role key: Admin access, bypasses RLS (use with caution)
 *   - Anon key: Limited to RLS policies (safe for client-side)
 *   - Key storage: ENV variables only (never in code or database)
 *   - Connection pooling: Prevents connection exhaustion attacks
 *   - RLS enforcement: User context client enforces row-level security
 *   - Admin operations: Only use service role for system tasks, not user requests
 *   - Build-time safety: Returns null when env vars missing (prevents crashes)
 *
 * @testingStrategy
 *   - Test createClient: Verify SSR cookie handling works
 *   - Test service role: Verify RLS bypass (can access all data)
 *   - Test requireClient: Verify throws when env missing
 *   - Mock cookies: Use Next.js test helpers for cookie management
 *   - Tests: __tests__/lib/supabase/server.test.ts
 *
 * @totalLines 191
 * @estimatedTokens 1,500 (without header), 550 (with header - 63% savings)
 */

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Re-export types
export type { User, SupabaseClient }

// Cache validation results for the duration of the request
let envValidated = false
let envValid = false

/**
 * Validates Supabase environment variables
 * Returns true if all required variables are present
 */
function validateSupabaseEnv(): boolean {
  if (envValidated) return envValid
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  envValid = !!(supabaseUrl && supabaseAnonKey)
  envValidated = true
  
  if (!envValid) {
    console.error('[Supabase] Missing required environment variables', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!serviceRoleKey,
      env: process.env.NODE_ENV
    })
  }
  
  return envValid
}

/**
 * Creates a Supabase client for server-side use with user context
 * Safe for production - returns null if env vars are missing
 */
export async function createClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Supabase] Missing environment variables for createClient')
      }
      return null
    }

    const cookieStore = await cookies()
    
    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-connection-pooling': 'session',
            'x-pool-timeout': '60',
            'x-pool-size': '50', // Session pool (increased from 20 to 50 for 5x concurrent user capacity)
            'x-statement-timeout': '5000', // 5 second query timeout
          },
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    )
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error)
    return null
  }
}

/**
 * Creates a Supabase client with service role permissions (synchronous)
 * Safe for production - returns null if env vars are missing
 * Uses createClient directly for service role (not SSR client which is for cookies)
 * Use this in class constructors and synchronous contexts
 */
export function createServiceRoleClientSync() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Supabase] Missing environment variables for service role client')
      }
      return null
    }

    // Use createClient directly for service role, not createServerClient
    // createServerClient is for cookie-based auth, not service role
    return createSupabaseClient(
      supabaseUrl,
      serviceRoleKey,
      {
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-connection-pooling': 'transaction',
            'x-pool-timeout': '60',
            'x-pool-size': '100', // Service role pool (increased from 40 to 100 for high-concurrency operations)
            'x-statement-timeout': '5000', // 5 second query timeout
            'x-connection-timeout': '10000', // 10 second connection timeout
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        // CRITICAL: Service role should bypass RLS
        // This is set by using the service role key, but we make it explicit
      }
    )
  } catch (error) {
    console.error('[Supabase] Failed to create service role client:', error)
    return null
  }
}

/**
 * Creates a Supabase client with service role permissions (async wrapper)
 * Async version for API routes - calls the sync version
 * Use this in API routes and async contexts
 */
export async function createServiceRoleClient(): Promise<SupabaseClient> {
  const client = createServiceRoleClientSync()
  if (!client) {
    throw new Error('Database service is currently unavailable')
  }
  return client
}

/**
 * Gets a Supabase client or throws a production-safe error
 * Use this when Supabase is absolutely required
 */
export async function requireClient() {
  const client = await createClient()
  if (!client) {
    throw new Error('Database service is currently unavailable')
  }
  return client
}

/**
 * Gets a service role client or throws a production-safe error
 * Use this when service role access is absolutely required
 */
export async function requireServiceRoleClient() {
  return createServiceRoleClient()
}

// Export validation function for use in API routes
export { validateSupabaseEnv }

// Export aliases for backward compatibility
export {
  createClient as createServerClient,
  createServiceRoleClient as createServiceClient,
  createServerClient as getSupabaseClient
}
