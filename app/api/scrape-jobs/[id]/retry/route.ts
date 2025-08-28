import { NextRequest, NextResponse } from 'next/server'
import { scrapeJobManager } from '@/lib/scrape-job-manager'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/scrape-jobs/[id]/retry
 * Retry a failed scrape job
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const job = await scrapeJobManager.retryJob(resolvedParams.id)

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: job,
      message: `Job scheduled for retry (attempt ${job.retry_count}/${job.max_retries})`
    })

  } catch (error) {
    const resolvedParams = await params;
    logger.error('Error retrying scrape job', { error: error instanceof Error ? error.message : error, jobId: resolvedParams.id })
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 404 })
      }
      
      if (error.message.includes('exceeded maximum retry')) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retry scrape job'
    }, { status: 500 })
  }
}