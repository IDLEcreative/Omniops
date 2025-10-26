import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { handleGetTelemetry, handleMonitoringAction } from './handlers';

/**
 * GET /api/monitoring/chat
 * Get comprehensive chat telemetry and cost analytics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    const response = await handleGetTelemetry(request, supabase);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in chat monitoring API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve monitoring data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/chat
 * Perform monitoring actions or set alerts
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    const response = await handleMonitoringAction(request, supabase);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in chat monitoring POST:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform monitoring action' },
      { status: 500 }
    );
  }
}
