/**
 * Customer Configuration Get Handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { enrichConfigsWithStatus } from './services'
import { checkSupabaseEnv, getSupabaseClient, parsePaginationParams, buildPaginationResponse } from './utils'

/**
 * GET /api/customer/config
 * Get customer configurations (optionally filtered by customer ID or domain)
 * REQUIRES AUTHENTICATION: User must be authenticated and member of organization
 */
export async function handleGet(request: NextRequest) {
  try {
    const envError = checkSupabaseEnv()
    if (envError) return envError

    const { client: supabase, error: clientError } = await getSupabaseClient()
    if (clientError) return clientError

    // SECURITY: Require authentication
    const { data: { user }, error: authError } = await supabase!.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthenticated request to GET /api/customer/config')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // SECURITY: Get user's organization to enforce isolation
    const { data: membership, error: membershipError } = await supabase!
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      logger.warn('User has no organization membership', { userId: user.id })
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const domain = searchParams.get('domain')
    const includeStatus = (searchParams.get('includeStatus') ?? '').toLowerCase() === 'true'
    const { limit, offset } = parsePaginationParams(searchParams)

    // SECURITY: Always filter by user's organization
    let query = supabase!
      .from('customer_configs')
      .select('*', { count: 'exact' })
      .eq('organization_id', membership.organization_id)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (customerId) query = query.eq('customer_id', customerId)
    if (domain) query = query.eq('domain', domain)

    const { data: configs, error, count } = await query

    if (error) {
      logger.error('Error fetching customer configs', { error, customerId, domain })
      return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
    }

    const configsWithStatus = await enrichConfigsWithStatus(configs, includeStatus)

    return NextResponse.json({
      success: true,
      data: configsWithStatus,
      pagination: buildPaginationResponse(count, limit, offset),
    })
  } catch (error) {
    logger.error('GET /api/customer/config error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
