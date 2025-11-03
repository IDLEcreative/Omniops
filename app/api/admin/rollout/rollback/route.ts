/**
 * Rollout Rollback API
 *
 * Purpose: Rollback feature to disabled state
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureName, reason } = body;

    if (!featureName) {
      return NextResponse.json(
        { success: false, error: 'featureName is required' },
        { status: 400 }
      );
    }

    const rolloutManager = getPilotRolloutManager();
    const result = await rolloutManager.rollbackFeature(
      featureName,
      reason || 'Manual rollback via admin UI'
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rolling back feature:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
