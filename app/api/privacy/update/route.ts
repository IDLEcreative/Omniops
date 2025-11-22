/**
 * POST /api/privacy/update
 * Update user's personal data
 * Complies with GDPR Article 16 (Right to Rectification)
 * Allows users to correct inaccurate personal data
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Only allow updating non-sensitive fields
const ALLOWED_UPDATE_FIELDS = ['name', 'phone', 'company'] as const;

const UpdateRequestSchema = z.object({
  field: z.enum(ALLOWED_UPDATE_FIELDS),
  value: z.string().min(1, 'Value cannot be empty'),
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

    // Validate request
    const body = await request.json();
    const validation = UpdateRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { field, value } = validation.data;

    // Update user metadata based on field
    let updateData: Record<string, any> = {};

    if (field === 'name') {
      // Update full_name in user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: value },
      });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `${field} updated successfully`,
        updated_field: field,
      });
    } else if (field === 'phone' || field === 'company') {
      // Update in user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: { [field]: value },
      });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `${field} updated successfully`,
        updated_field: field,
      });
    }

    return NextResponse.json(
      { error: 'Invalid field specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}
