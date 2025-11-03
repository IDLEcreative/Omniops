/**
 * Rollout Advance API
 *
 * Purpose: Advance feature rollout to next tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureName } = body;

    if (!featureName) {
      return NextResponse.json(
        { success: false, error: 'featureName is required' },
        { status: 400 }
      );
    }

    const rolloutManager = getPilotRolloutManager();
    const result = await rolloutManager.advanceRollout(featureName);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newTier: result.newTier,
    });
  } catch (error) {
    console.error('Error advancing rollout:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
