/**
 * Autonomous Operations Queue Retry API
 *
 * POST /api/autonomous/operations/queue/retry
 * Retries a failed operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOperationQueueManager } from '@/lib/autonomous/queue';
import { requireAuth } from '@/lib/middleware/auth';
import { getUserOrganization } from '@/lib/auth/api-helpers';
import { z } from 'zod';

const RetryRequestSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = RetryRequestSchema.parse(body);

    // Authenticate user
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult; // Return auth error
    }

    const { user, supabase } = authResult;

    // Get user's organization
    const orgResult = await getUserOrganization(user.id, supabase);
    if (orgResult instanceof NextResponse) {
      return orgResult;
    }

    const { organizationId } = orgResult;

    // Verify ownership: Find operation by job_id and check organization
    const { data: operation, error: opError } = await supabase
      .from('autonomous_operations')
      .select('id, organization_id')
      .eq('job_id', jobId)
      .single();

    if (opError || !operation) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    if (operation.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    // Get queue manager
    const queueManager = getOperationQueueManager();

    // Retry the job
    const retried = await queueManager.retryOperation(jobId);

    if (!retried) {
      return NextResponse.json(
        { error: 'Job not found or cannot be retried' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Operation queued for retry',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[API] Queue retry error:', error);
    return NextResponse.json(
      { error: 'Failed to retry operation', details: (error as Error).message },
      { status: 500 }
    );
  }
}
