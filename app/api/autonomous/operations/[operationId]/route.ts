/**
 * Autonomous Operation Details API
 *
 * GET /api/autonomous/operations/:operationId
 * Fetches detailed information about a specific operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getUserOrganization } from '@/lib/auth/api-helpers';
import { getOperationQueueManager } from '@/lib/autonomous/queue';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ operationId: string }> }
) {
  try {
    const { operationId } = await params;

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

    // Fetch operation and verify ownership
    const { data: operation, error } = await supabase
      .from('autonomous_operations')
      .select('*')
      .eq('id', operationId)
      .single();

    if (error || !operation) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    // Verify the operation belongs to user's organization
    if (operation.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    // If operation has a job_id, fetch real-time status from queue
    if (operation.job_id) {
      try {
        const queueManager = getOperationQueueManager();
        const jobStatus = await queueManager.getJobStatus(operation.job_id);

        if (jobStatus) {
          // Merge queue status with database record
          operation.progress = jobStatus.progress;
          operation.status = jobStatus.status as any;

          // If job is completed/failed, ensure database is updated
          if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
            const updateData: any = {
              status: jobStatus.status,
              completed_at: jobStatus.finishedOn ? new Date(jobStatus.finishedOn).toISOString() : new Date().toISOString(),
            };

            if (jobStatus.status === 'failed' && jobStatus.failedReason) {
              updateData.error_message = jobStatus.failedReason;
            }

            if (jobStatus.returnvalue) {
              updateData.result = jobStatus.returnvalue;
            }

            await supabase
              .from('autonomous_operations')
              .update(updateData)
              .eq('id', operationId);

            // Update local operation object
            Object.assign(operation, updateData);
          }
        }
      } catch (queueError) {
        console.error('[API] Failed to fetch queue status:', queueError);
        // Continue with database record if queue fails
      }
    }

    return NextResponse.json({
      success: true,
      operation,
    });
  } catch (error) {
    console.error('[API] Operation details error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
