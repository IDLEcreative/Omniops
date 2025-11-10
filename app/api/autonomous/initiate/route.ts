/**
 * POST /api/autonomous/initiate
 *
 * Initiate an autonomous operation
 *
 * Request:
 * {
 *   "service": "woocommerce",
 *   "operation": "api_key_generation",
 *   "metadata": { "storeUrl": "https://shop.example.com" }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "operationId": "uuid",
 *   "status": "pending" | "awaiting_consent",
 *   "message": "Operation initiated successfully"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOperation } from '@/lib/autonomous/core/operation-service';
import { createServerClient } from '@/lib/supabase/server';

// ============================================================================
// Validation Schema
// ============================================================================

const InitiateRequestSchema = z.object({
  service: z.enum(['woocommerce', 'stripe', 'shopify']),
  operation: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const validatedData = InitiateRequestSchema.parse(body);

    // Get authenticated user
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const organizationId = userData.organization_id;

    // Create operation
    const operation = await createOperation({
      organizationId,
      userId: user.id,
      service: validatedData.service,
      operation: validatedData.operation,
      metadata: validatedData.metadata
    });

    // TODO: Enqueue job in BullMQ if status is 'pending'

    return NextResponse.json({
      success: true,
      operationId: operation.id,
      status: operation.status,
      message: operation.status === 'awaiting_consent'
        ? 'Consent required before operation can proceed'
        : 'Operation initiated successfully'
    });

  } catch (error) {
    console.error('[POST /api/autonomous/initiate] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
