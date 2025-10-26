/**
 * Customer Configuration Delete Handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { checkSupabaseEnv, getSupabaseClient } from './utils'

/**
 * DELETE /api/customer/config/[id]
 * Delete a customer configuration and cancel any pending scraping
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

    const { data: config, error: fetchError } = await supabase!
      .from('customer_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (fetchError || !config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
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
