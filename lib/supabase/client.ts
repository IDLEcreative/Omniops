import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Provide fallback values for build time when env vars might not be available
  // These will be replaced with actual values at runtime on the client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}