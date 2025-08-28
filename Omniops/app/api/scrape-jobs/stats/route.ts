import { NextRequest, NextResponse } from 'next/server'
import { scrapeJobManager } from '@/lib/scrape-job-manager'
import { logger } from '@/lib/logger'

/**
 * GET /api/scrape-jobs/stats
 * Get scrape job statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || undefined

    const stats = await scrapeJobManager.getJobStats(domain)

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        domain: domain || 'all_domains',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Error getting scrape job stats', { error: error instanceof Error ? error.message : error })
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scrape job statistics'
    }, { status: 500 })
  }
}