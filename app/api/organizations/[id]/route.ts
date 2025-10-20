import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  settings: z.record(z.any()).optional(),
  plan_type: z.string().optional(),
  seat_limit: z.number().int().positive().optional(),
});

/**
 * GET /api/organizations/[id]
 * Get organization details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const organizationId = params.id;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to fetch organization' },
        { status: 500 }
      );
    }

    // Get member count
    const { count: memberCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get domain count
    const { count: domainCount } = await supabase
      .from('domains')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return NextResponse.json({
      organization: {
        ...organization,
        user_role: membership.role,
        member_count: memberCount || 0,
        domain_count: domainCount || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]
 * Update organization details (owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const organizationId = params.id;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is owner
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only organization owners can update settings' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateOrganizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Update organization
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update(validation.data)
      .eq('id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organization: {
        ...organization,
        user_role: 'owner',
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete organization (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const organizationId = params.id;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is owner
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only organization owners can delete the organization' },
        { status: 403 }
      );
    }

    // Delete organization (CASCADE will handle related records)
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (deleteError) {
      console.error('Error deleting organization:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete organization' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Organization deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
