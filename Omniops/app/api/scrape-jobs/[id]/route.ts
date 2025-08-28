import { NextRequest, NextResponse } from 'next/server'
import { scrapeJobManager, UpdateScrapeJobOptions } from '@/lib/scrape-job-manager'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/scrape-jobs/[id]
 * Get a specific scrape job by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const job = await scrapeJobManager.getJob(resolvedParams.id)

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: job
    })

  } catch (error) {
    const resolvedParams = await params;
    logger.error('Error getting scrape job', { error: error instanceof Error ? error.message : error, jobId: resolvedParams.id })
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scrape job'
    }, { status: 500 })
  }
}

/**
 * PUT /api/scrape-jobs/[id]
 * Update a scrape job
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const body = await request.json() as UpdateScrapeJobOptions

    const job = await scrapeJobManager.updateJob(resolvedParams.id, body)

    return NextResponse.json({
      success: true,
      data: job,
      message: 'Job updated successfully'
    })

  } catch (error) {
    const resolvedParams = await params;
    logger.error('Error updating scrape job', { error: error instanceof Error ? error.message : error, jobId: resolvedParams.id })
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update scrape job'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/scrape-jobs/[id]
 * Cancel a scrape job
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'Cancelled via API'

    const job = await scrapeJobManager.cancelJob(resolvedParams.id, reason)

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found or cannot be cancelled'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: job,
      message: 'Job cancelled successfully'
    })

  } catch (error) {
    const resolvedParams = await params;
    logger.error('Error cancelling scrape job', { error: error instanceof Error ? error.message : error, jobId: resolvedParams.id })
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel scrape job'
    }, { status: 500 })
  }
}