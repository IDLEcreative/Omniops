/**
 * Customer Configuration Delete Handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { checkSupabaseEnv, getSupabaseClient } from './utils'

/**
 * DELETE /api/customer/config/[id]
 * Delete a customer configuration and cancel any pending scraping
 * REQUIRES AUTHENTICATION: User must be admin/owner of the organization
 */
export async function handleDelete(request: NextRequest) {
  try {
    const envError = checkSupabaseEnv()
    if (envError) return envError

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 })
    }

    const { client: supabase, error: clientError } = await getSupabaseClient()
    if (clientError) return clientError

    // SECURITY: Require authentication
    const { data: { user }, error: authError } = await supabase!.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthenticated request to DELETE /api/customer/config')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch config first to get organization_id
    const { data: config, error: fetchError } = await supabase!
      .from('customer_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (fetchError || !config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // SECURITY: Verify user is member of the config's organization
    const { data: membership, error: membershipError } = await supabase!
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', config.organization_id)
      .single()

    if (membershipError || !membership) {
      logger.warn('User not authorized to delete config', {
        userId: user.id,
        configId,
        organizationId: config.organization_id
      })
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this organization' },
        { status: 403 }
      )
    }

    // SECURITY: Only admins and owners can delete configs
    if (!['admin', 'owner'].includes(membership.role)) {
      logger.warn('Insufficient permissions to delete config', {
        userId: user.id,
        role: membership.role,
        configId
      })
      return NextResponse.json(
        { error: 'Forbidden: Only admins and owners can delete configurations' },
        { status: 403 }
      )
    }

    const { data: pendingJobs, error: jobsError } = await supabase!
      .from('scrape_jobs')
      .update({
        status: 'cancelled',
        error_message: 'Customer configuration deleted',
        completed_at: new Date().toISOString(),
      })
      .eq('customer_config_id', configId)
      .in('status', ['pending', 'running'])
      .select('id')

    if (jobsError) {
      logger.warn('Error cancelling jobs during config deletion', { configId, error: jobsError })
    } else {
      logger.info('Cancelled pending jobs for deleted config', {
        configId,
        cancelledJobs: pendingJobs?.length || 0,
      })
    }

    const { error: deleteError } = await supabase!.from('customer_configs').delete().eq('id', configId)

    if (deleteError) {
      logger.error('Error deleting customer config', { error: deleteError, configId })
      return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 })
    }

    logger.info('Customer configuration deleted', {
      configId,
      customerId: config.customer_id,
      domain: config.domain,
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
      cancelledJobs: pendingJobs?.length || 0,
    })
  } catch (error) {
    logger.error('DELETE /api/customer/config error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
