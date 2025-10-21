import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/auth/me
 * Get current user with organization membership
 * Replaces the legacy /api/auth/customer endpoint
 */
export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to initialize Supabase client' },
        { status: 500 }
      );
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id, role, joined_at, organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error('Error fetching organization membership:', membershipError);
    }

    // If user has organization, fetch organization details
    let organizationData = null;
    if (membership?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, plan_type, seat_limit')
        .eq('id', membership.organization_id)
        .single();

      if (org) {
        organizationData = {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: membership.role,
          plan_type: org.plan_type,
          seat_limit: org.seat_limit,
          joined_at: membership.joined_at,
        };
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        created_at: user.created_at,
      },
      organization: organizationData,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
