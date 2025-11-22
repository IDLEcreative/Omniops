/**
 * POST /api/privacy/delete/cancel
 * Cancel a pending account deletion request
 * User has up to 30 days to cancel after requesting deletion
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { cancelAccountDeletionRequest, getPendingDeletionRequest } from '@/lib/privacy/account-deletion';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has pending deletion
    const pendingRequest = await getPendingDeletionRequest(user.id);
    if (!pendingRequest) {
      return NextResponse.json(
        { error: 'No pending deletion request found' },
        { status: 404 }
      );
    }

    // Check if deletion date has passed
    const scheduledDate = new Date(pendingRequest.scheduled_for);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        {
          error: 'Deletion period has ended, account deletion is in progress',
          scheduled_for: pendingRequest.scheduled_for,
        },
        { status: 410 }
      );
    }

    // Cancel the deletion request
    await cancelAccountDeletionRequest(user.id);

    return NextResponse.json({
      success: true,
      message: 'Account deletion cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel deletion' },
      { status: 500 }
    );
  }
}
