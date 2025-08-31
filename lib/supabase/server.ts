import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
 * Creates a Supabase client with service role permissions
 * Safe for production - returns null if env vars are missing
 */
export async function createServiceRoleClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Supabase] Missing environment variables for service role client')
      }
      return null
    }
    
    return createServerClient(
      supabaseUrl,
      serviceRoleKey,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-connection-pooling': 'transaction',
            'x-pool-timeout': '60',
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  } catch (error) {
    console.error('[Supabase] Failed to create service role client:', error)
    return null
  }
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
  const client = await createServiceRoleClient()
  if (!client) {
    throw new Error('Database service is currently unavailable')
  }
  return client
}

// Export validation function for use in API routes
export { validateSupabaseEnv }