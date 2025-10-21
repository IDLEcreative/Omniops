import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

// Organization creation schema
const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
});

/**
 * POST /api/organizations/create
 * Creates a new organization and makes the authenticated user the owner
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already has an organization
    const { data: existingMembership } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json(
        {
          error: 'User already belongs to an organization',
          organization: existingMembership.organization_id
        },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateOrganizationSchema.parse(body);

    // Generate slug if not provided
    const slug = validatedData.slug ||
      `${validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${user.id.substring(0, 8)}`;

    // Use service role client for organization creation
    const serviceSupabase = await createServiceRoleClient();

    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Create organization
    const { data: organization, error: orgError } = await serviceSupabase
      .from('organizations')
      .insert({
        name: validatedData.name,
        slug: slug,
        plan_type: 'free',
        seat_limit: 5,
      })
      .select()
      .single();

    if (orgError) {
      // Check for duplicate slug
      if (orgError.code === '23505') {
        return NextResponse.json(
          { error: 'Organization name already exists. Please choose a different name.' },
          { status: 409 }
        );
      }
      throw orgError;
    }

    // Create organization membership (user as owner)
    const { error: memberError } = await serviceSupabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'owner',
        invited_by: user.id,
      });

    if (memberError) {
      // Rollback - delete organization if member creation fails
      await serviceSupabase
        .from('organizations')
        .delete()
        .eq('id', organization.id);

      throw memberError;
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan_type: organization.plan_type,
        seat_limit: organization.seat_limit,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating organization:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid organization data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
