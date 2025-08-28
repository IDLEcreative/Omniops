import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

interface ScrapeJobWebhookPayload {
  event: string
  job_id: string
  domain: string
  job_type: string
  status: string
  priority: number
  created_at: string
  metadata: Record<string, any>
}

interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: Record<string, any>
  old_record?: Record<string, any>
  schema: string
}

/**
 * Webhook endpoint for Supabase database changes and scraping job notifications
 * Handles automatic scraping job creation and processing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify webhook signature if configured
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-supabase-signature')
      if (!signature) {
        logger.warn('Webhook received without signature', { url: request.url })
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }
      
      // TODO: Implement signature verification
      // For now, we'll log and continue
      logger.info('Webhook signature present', { signature: signature.substring(0, 10) + '...' })
    }

    const payload = await request.json()
    logger.info('Received webhook payload', { 
      type: payload.type || payload.event,
      table: payload.table,
      domain: payload.domain || payload.record?.domain
    })

    // Handle different webhook types
    if (payload.event === 'scrape_job_created') {
      return await handleScrapeJobCreated(payload as ScrapeJobWebhookPayload, supabase)
    } else if (payload.type && payload.table) {
      return await handleDatabaseWebhook(payload as SupabaseWebhookPayload, supabase)
    }

    logger.warn('Unknown webhook payload format', { payload })
    return NextResponse.json({ error: 'Unknown webhook format' }, { status: 400 })

  } catch (error) {
    logger.error('Webhook processing error', { error: error instanceof Error ? error.message : error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleScrapeJobCreated(payload: ScrapeJobWebhookPayload, supabase: any) {
  try {
    const { job_id, domain, job_type, priority } = payload

    logger.info('Processing scrape job webhook', { job_id, domain, job_type, priority })

    // Verify the job exists and is in pending status
    const { data: job, error: jobError } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('id', job_id)
      .eq('status', 'pending')
      .single()

    if (jobError || !job) {
      logger.warn('Scrape job not found or not pending', { job_id, error: jobError })
      return NextResponse.json({ error: 'Job not found or not pending' }, { status: 404 })
    }

    // Add job to processing queue (you can integrate with your preferred queue system)
    const queueResult = await addToScrapeQueue(job)
    
    if (queueResult.success) {
      logger.info('Scrape job added to queue successfully', { job_id, domain })
      return NextResponse.json({ 
        success: true, 
        message: 'Job queued for processing',
        job_id,
        queue_id: queueResult.queue_id
      })
    } else {
      logger.error('Failed to add job to queue', { job_id, error: queueResult.error })
      return NextResponse.json({ 
        error: 'Failed to queue job',
        job_id 
      }, { status: 500 })
    }

  } catch (error) {
    logger.error('Error handling scrape job webhook', { error: error instanceof Error ? error.message : error })
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

async function handleDatabaseWebhook(payload: SupabaseWebhookPayload, supabase: any) {
  try {
    const { type, table, record, old_record } = payload

    logger.info('Processing database webhook', { type, table, record_id: record?.id })

    // Handle customer_configs changes
    if (table === 'customer_configs') {
      return await handleCustomerConfigChange(type, record, old_record, supabase)
    }
    
    // Handle domains changes
    if (table === 'domains') {
      return await handleDomainChange(type, record, old_record, supabase)
    }

    logger.info('Webhook for table not handled', { table })
    return NextResponse.json({ message: 'Webhook received but not processed' })

  } catch (error) {
    logger.error('Error handling database webhook', { error: error instanceof Error ? error.message : error })
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

async function handleCustomerConfigChange(
  type: string, 
  record: any, 
  old_record: any, 
  supabase: any
) {
  if (type === 'INSERT' && record.domain) {
    logger.info('New customer config with domain created', { 
      config_id: record.id, 
      domain: record.domain 
    })
    // Job creation is handled by database trigger
    return NextResponse.json({ message: 'Customer config webhook processed' })
  }
  
  if (type === 'UPDATE' && record.domain !== old_record?.domain) {
    logger.info('Customer config domain updated', { 
      config_id: record.id, 
      old_domain: old_record?.domain,
      new_domain: record.domain 
    })
    // Job creation is handled by database trigger
    return NextResponse.json({ message: 'Customer config update webhook processed' })
  }

  return NextResponse.json({ message: 'Customer config webhook processed' })
}

async function handleDomainChange(
  type: string, 
  record: any, 
  old_record: any, 
  supabase: any
) {
  if (type === 'INSERT' && record.domain) {
    logger.info('New domain created', { 
      domain_id: record.id, 
      domain: record.domain 
    })
    // Job creation is handled by database trigger
    return NextResponse.json({ message: 'Domain webhook processed' })
  }
  
  if (type === 'UPDATE' && record.domain !== old_record?.domain) {
    logger.info('Domain updated', { 
      domain_id: record.id, 
      old_domain: old_record?.domain,
      new_domain: record.domain 
    })
    // Job creation is handled by database trigger
    return NextResponse.json({ message: 'Domain update webhook processed' })
  }

  return NextResponse.json({ message: 'Domain webhook processed' })
}

/**
 * Add scraping job to queue system
 * This is a placeholder - integrate with your preferred queue system
 * (Redis Bull Queue, AWS SQS, etc.)
 */
async function addToScrapeQueue(job: any) {
  try {
    // For now, we'll simulate queue processing
    // You can replace this with actual queue integration
    
    logger.info('Simulating queue addition for job', { 
      job_id: job.id, 
      domain: job.domain,
      job_type: job.job_type 
    })

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100))

    // In a real implementation, you might:
    // 1. Add to Redis queue
    // 2. Send to AWS SQS
    // 3. Add to database-backed queue
    // 4. Trigger serverless function
    
    const queue_id = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      success: true,
      queue_id,
      message: 'Job added to scraping queue'
    }

  } catch (error) {
    logger.error('Error adding job to queue', { error: error instanceof Error ? error.message : error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown queue error'
    }
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoint: 'customer-webhook'
  })
}