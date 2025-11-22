/**
 * POST /api/privacy/delete
 * Request account deletion with 30-day cooling-off period
 * Complies with GDPR Article 17 (Right to be Forgotten)
 *
 * User must:
 * 1. Authenticate with their password
 * 2. Confirm deletion request
 * 3. Wait 30 days before deletion is executed
 * 4. Can cancel deletion request within 30-day period
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { createAccountDeletionRequest, getPendingDeletionRequest } from '@/lib/privacy/account-deletion';
import { z } from 'zod';
import { structuredLogger } from '@/lib/monitoring/logger';
import { captureError } from '@/lib/monitoring/sentry';

const DeletionRequestSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirm: z.boolean().refine(v => v === true, 'Deletion must be confirmed'),
});

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

    // Validate request body
    const body = await request.json();
    const validation = DeletionRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if user already has pending deletion
    const existingRequest = await getPendingDeletionRequest(user.id);
    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'Deletion already scheduled',
          scheduled_for: existingRequest.scheduled_for,
          days_remaining: Math.ceil(
            (new Date(existingRequest.scheduled_for).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
          ),
        },
        { status: 409 }
      );
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validation.data.password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 403 }
      );
    }

    // Create scheduled deletion request (30 days from now)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 30);

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    await createAccountDeletionRequest({
      user_id: user.id,
      scheduled_for: scheduledDate.toISOString(),
      ip_address: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: 'Account deletion scheduled',
      scheduled_for: scheduledDate.toISOString(),
      days_until_deletion: 30,
      can_cancel_until: scheduledDate.toISOString(),
    });
  } catch (error) {
    structuredLogger.error('Account deletion error', {
      error: String(error)
    }, error instanceof Error ? error : undefined);
    captureError(error, {
      operation: 'account-deletion',
      endpoint: '/api/privacy/delete'
    });
    return NextResponse.json(
      { error: 'Failed to schedule deletion' },
      { status: 500 }
    );
  }
}
