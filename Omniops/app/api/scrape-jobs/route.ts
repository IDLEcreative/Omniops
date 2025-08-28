import { NextRequest, NextResponse } from 'next/server'
import { scrapeJobManager, CreateScrapeJobOptions, UpdateScrapeJobOptions } from '@/lib/scrape-job-manager'
import { logger } from '@/lib/logger'

/**
 * GET /api/scrape-jobs
 * Get scrape jobs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const domain = searchParams.get('domain') || undefined
    const statusParam = searchParams.get('status')
    const status = statusParam ? statusParam.split(',') as any[] : undefined
    const job_type = searchParams.get('job_type') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const order_by = (searchParams.get('order_by') || 'created_at') as any
    const order_direction = (searchParams.get('order_direction') || 'desc') as 'asc' | 'desc'

    const result = await scrapeJobManager.getJobs({
      domain,
      status,
      job_type,
      limit,
      offset,
      order_by,
      order_direction
    })

    return NextResponse.json({
      success: true,
      data: result.jobs,
      pagination: {
        offset,
        limit,
        total: result.count,
        has_more: offset + limit < result.count
      }
    })

  } catch (error) {
    logger.error('Error getting scrape jobs', { error: error instanceof Error ? error.message : error })
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scrape jobs'
    }, { status: 500 })
  }
}

/**
 * POST /api/scrape-jobs
 * Create a new scrape job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateScrapeJobOptions

    // Validate required fields
    if (!body.domain) {
      return NextResponse.json({
        success: false,
        error: 'Domain is required'
      }, { status: 400 })
    }

    const job = await scrapeJobManager.createJob(body)

    return NextResponse.json({
      success: true,
      data: job,
      message: 'Scrape job created successfully'
    }, { status: 201 })

  } catch (error) {
    logger.error('Error creating scrape job', { error: error instanceof Error ? error.message : error })
    
    // Handle known errors with appropriate status codes
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 409 }) // Conflict
      }
      
      if (error.message.includes('required') || error.message.includes('must be between')) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 }) // Bad Request
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scrape job'
    }, { status: 500 })
  }
}