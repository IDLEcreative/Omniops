/**
 * Customer Configuration Utilities
 *
 * Common utility functions for config handlers
 */

import { NextResponse } from 'next/server'
import { createClient, validateSupabaseEnv } from '@/lib/supabase-server'

/**
 * Common error responses
 */
export const SERVICE_UNAVAILABLE = {
  error: 'Service temporarily unavailable',
  message: 'The service is currently undergoing maintenance. Please try again later.',
}

export const DB_CONNECTION_FAILED = { error: 'Database connection failed' }

/**
 * Validate Supabase environment and return error response if invalid
 */
export function checkSupabaseEnv(): NextResponse | null {
  if (!validateSupabaseEnv()) {
    return NextResponse.json(SERVICE_UNAVAILABLE, { status: 503 })
  }
  return null
}

/**
 * Create Supabase client and return error response if failed
 */
export async function getSupabaseClient() {
  const supabase = await createClient()
  if (!supabase) {
    return { client: null, error: NextResponse.json(DB_CONNECTION_FAILED, { status: 503 }) }
  }
  return { client: supabase, error: null }
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const rawLimit = Number(searchParams.get('limit'))
  const rawOffset = Number(searchParams.get('offset'))
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, Math.floor(rawLimit))) : 50
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0

  return { limit, offset }
}

/**
 * Build pagination response object
 */
export function buildPaginationResponse(count: number | null, limit: number, offset: number) {
  return {
    total: count || 0,
    limit,
    offset,
    hasMore: (count || 0) > offset + limit,
  }
}
