import { NextRequest, NextResponse } from 'next/server';
import { DomainRefreshLock } from '@/lib/domain-refresh-lock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/domain-lock/status?domainId=xxx
 * Check the lock status for a specific domain
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');

  if (!domainId) {
    return NextResponse.json({ error: 'domainId required' }, { status: 400 });
  }

  try {
    const lock = new DomainRefreshLock();
    const isLocked = await lock.isLocked(domainId);
    const timeRemaining = await lock.getTimeRemaining(domainId);

    return NextResponse.json({
      domainId,
      isLocked,
      timeRemaining: isLocked ? timeRemaining : null,
      message: isLocked
        ? `Refresh in progress, ${timeRemaining}s remaining on lock`
        : 'No active refresh',
    });
  } catch (error) {
    console.error('[DomainLock] Error checking status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check lock status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/domain-lock/status?domainId=xxx
 * Force release a lock (admin only - use with caution)
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');

  if (!domainId) {
    return NextResponse.json({ error: 'domainId required' }, { status: 400 });
  }

  try {
    const lock = new DomainRefreshLock();
    await lock.forceRelease(domainId);

    return NextResponse.json({
      domainId,
      message: 'Lock forcefully released',
    });
  } catch (error) {
    console.error('[DomainLock] Error releasing lock:', error);
    return NextResponse.json(
      {
        error: 'Failed to release lock',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
