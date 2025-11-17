import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { ChartAnnotation } from '@/types/dashboard';

/**
 * GET /api/analytics/annotations
 *
 * Fetch chart annotations for the user's organization
 * Optional query params:
 * - startDate: Filter annotations on or after this date (ISO string)
 * - endDate: Filter annotations on or before this date (ISO string)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // 2. Get user's organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 404 });
    }

    // 3. Get date range filters from query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 4. Build query with optional date filters
    let query = supabase
      .from('chart_annotations')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .order('annotation_date', { ascending: false });

    if (startDate) {
      query = query.gte('annotation_date', startDate);
    }

    if (endDate) {
      query = query.lte('annotation_date', endDate);
    }

    const { data: annotations, error: annotationsError } = await query;

    if (annotationsError) {
      console.error('[Annotations API] Error fetching annotations:', annotationsError);
      return NextResponse.json({ error: 'Failed to fetch annotations' }, { status: 500 });
    }

    return NextResponse.json({ annotations: annotations || [] });

  } catch (error) {
    console.error('[Annotations API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/analytics/annotations
 *
 * Create a new chart annotation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // 2. Get user's organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 404 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { annotation_date, title, description, category = 'other', color = '#3b82f6' } = body;

    // 4. Validation
    if (!annotation_date || typeof annotation_date !== 'string') {
      return NextResponse.json({ error: 'annotation_date is required and must be a string (ISO date)' }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.length === 0 || title.length > 200) {
      return NextResponse.json({ error: 'title is required and must be 1-200 characters' }, { status: 400 });
    }

    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return NextResponse.json({ error: 'description must be 0-1000 characters' }, { status: 400 });
    }

    if (!['campaign', 'incident', 'release', 'event', 'other'].includes(category)) {
      return NextResponse.json({ error: 'category must be one of: campaign, incident, release, event, other' }, { status: 400 });
    }

    if (typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: 'color must be a valid hex color code (e.g., #3b82f6)' }, { status: 400 });
    }

    // 5. Create annotation (RLS policies will enforce organization_id)
    const { data: annotation, error: insertError } = await supabase
      .from('chart_annotations')
      .insert({
        organization_id: membership.organization_id,
        annotation_date,
        title,
        description: description || null,
        category,
        color,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Annotations API] Error creating annotation:', insertError);
      return NextResponse.json({ error: 'Failed to create annotation' }, { status: 500 });
    }

    return NextResponse.json({ annotation }, { status: 201 });

  } catch (error) {
    console.error('[Annotations API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/analytics/annotations
 *
 * Update an existing chart annotation
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { supabase } = authResult;

    // 2. Parse request body
    const body = await request.json();
    const { id, annotation_date, title, description, category, color } = body;

    // 3. Validation
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required and must be a string' }, { status: 400 });
    }

    // Build update object (only include fields that are provided)
    const updates: Partial<ChartAnnotation> = {};

    if (annotation_date !== undefined) {
      if (typeof annotation_date !== 'string') {
        return NextResponse.json({ error: 'annotation_date must be a string (ISO date)' }, { status: 400 });
      }
      updates.date = annotation_date;
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || title.length === 0 || title.length > 200) {
        return NextResponse.json({ error: 'title must be 1-200 characters' }, { status: 400 });
      }
      updates.title = title;
    }

    if (description !== undefined) {
      if (description !== null && (typeof description !== 'string' || description.length > 1000)) {
        return NextResponse.json({ error: 'description must be 0-1000 characters or null' }, { status: 400 });
      }
      updates.description = description;
    }

    if (category !== undefined) {
      if (!['campaign', 'incident', 'release', 'event', 'other'].includes(category)) {
        return NextResponse.json({ error: 'category must be one of: campaign, incident, release, event, other' }, { status: 400 });
      }
      updates.category = category;
    }

    if (color !== undefined) {
      if (typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return NextResponse.json({ error: 'color must be a valid hex color code (e.g., #3b82f6)' }, { status: 400 });
      }
      updates.color = color;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // 4. Update annotation (RLS policies will enforce organization access)
    const { data: annotation, error: updateError } = await supabase
      .from('chart_annotations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Annotations API] Error updating annotation:', updateError);

      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Annotation not found or access denied' }, { status: 404 });
      }

      return NextResponse.json({ error: 'Failed to update annotation' }, { status: 500 });
    }

    return NextResponse.json({ annotation });

  } catch (error) {
    console.error('[Annotations API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/analytics/annotations
 *
 * Delete a chart annotation
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { supabase } = authResult;

    // 2. Get annotation ID from query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 });
    }

    // 3. Delete annotation (RLS policies will enforce organization access)
    const { error: deleteError } = await supabase
      .from('chart_annotations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[Annotations API] Error deleting annotation:', deleteError);
      return NextResponse.json({ error: 'Failed to delete annotation' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[Annotations API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
