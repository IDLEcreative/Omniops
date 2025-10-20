import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

/**
 * GET /api/organizations
 * List all organizations the current user belongs to
 */
export async function GET() {
  try {
    const supabase = createServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's organizations with member info
    const { data: memberships, error: membershipsError } = await supabase
      .from('organization_members')
      .select(`
        role,
        joined_at,
        organization:organizations (
          id,
          name,
          slug,
          settings,
          plan_type,
          seat_limit,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (membershipsError) {
      console.error('Error fetching organizations:', membershipsError);
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      );
    }

    // Get member counts for each organization
    const organizationsWithRole = await Promise.all(
      (memberships || []).map(async (membership) => {
        const org = membership.organization;

        // Count members
        const { count } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        return {
          ...org,
          user_role: membership.role,
          member_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      organizations: organizationsWithRole,
    });
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createOrganizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, slug } = validation.data;

    // Generate slug if not provided
    const finalSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    // Check if slug is unique
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('slug')
      .eq('slug', finalSlug)
      .maybeSingle();

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already exists' },
        { status: 409 }
      );
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug: finalSlug,
        settings: {},
        plan_type: 'free',
        seat_limit: 5,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error adding owner:', memberError);
      // Try to clean up the organization
      await supabase.from('organizations').delete().eq('id', organization.id);
      return NextResponse.json(
        { error: 'Failed to create organization membership' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        organization: {
          ...organization,
          user_role: 'owner',
          member_count: 1,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
