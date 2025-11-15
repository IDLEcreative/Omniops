/**
 * GET /api/autonomous/status/:operationId
 *
 * Get autonomous operation status and progress
 *
 * Response:
 * {
 *   "id": "uuid",
 *   "status": "in_progress",
 *   "currentStep": 3,
 *   "totalSteps": 9,
 *   "result": null,
 *   "createdAt": "2025-11-10T...",
 *   "startedAt": "2025-11-10T...",
 *   "completedAt": null
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOperation } from '@/lib/autonomous/core/operation-service';
import { getOperationAuditLogs } from '@/lib/autonomous/security/audit-logger';
import { createServerClient } from '@/lib/supabase/server';

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ operationId: string }> }
) {
  try {
    const { operationId } = await params;

    // Get authenticated user
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get operation
    const operation = await getOperation(operationId);

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    // Verify user owns this operation
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.organization_id !== operation.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get audit logs for detailed progress
    const auditLogs = await getOperationAuditLogs(operationId);

    // Get recent screenshots (last 3)
    const recentScreenshots = auditLogs
      .filter(log => log.screenshotUrl)
      .slice(-3)
      .map(log => log.screenshotUrl);

    // Calculate progress percentage
    const progressPercent = operation.totalSteps
      ? Math.round((operation.currentStep / operation.totalSteps) * 100)
      : 0;

    // Get current step intent
    const currentStepLog = auditLogs.find(log => log.stepNumber === operation.currentStep);

    return NextResponse.json({
      id: operation.id,
      service: operation.service,
      operation: operation.operation,
      status: operation.status,
      currentStep: operation.currentStep,
      totalSteps: operation.totalSteps,
      progressPercent,
      currentIntent: currentStepLog?.intent,
      result: operation.result,
      createdAt: operation.createdAt,
      startedAt: operation.startedAt,
      completedAt: operation.completedAt,
      recentScreenshots
    });

  } catch (error) {
    console.error('[GET /api/autonomous/status/:operationId] Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
