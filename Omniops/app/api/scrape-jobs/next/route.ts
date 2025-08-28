import { NextRequest, NextResponse } from 'next/server'
import { scrapeJobManager } from '@/lib/scrape-job-manager'
import { logger } from '@/lib/logger'

/**
 * GET /api/scrape-jobs/next
 * Get the next pending job from the queue
 */
export async function GET(request: NextRequest) {
  try {
    const job = await scrapeJobManager.getNextJob()

    if (!job) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No pending jobs in queue'
      })
    }

    return NextResponse.json({
      success: true,
      data: job
    })

  } catch (error) {
    logger.error('Error getting next job', { error: error instanceof Error ? error.message : error })
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get next job'
    }, { status: 500 })
  }
}

/**
 * POST /api/scrape-jobs/next/claim
 * Claim the next job (atomic operation)
 */
export async function POST(request: NextRequest) {
  try {
    // Get next job
    const nextJob = await scrapeJobManager.getNextJob()
    
    if (!nextJob) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No pending jobs to claim'
      })
    }

    // Try to claim it
    const claimedJob = await scrapeJobManager.claimJob(nextJob.id)
    
    if (!claimedJob) {
      // Job was claimed by someone else, try again
      return NextResponse.json({
        success: false,
        error: 'Job was already claimed by another worker',
        retry: true
      }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      data: claimedJob,
      message: 'Job claimed successfully'
    })

  } catch (error) {
    logger.error('Error claiming next job', { error: error instanceof Error ? error.message : error })
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to claim next job'
    }, { status: 500 })
  }
}