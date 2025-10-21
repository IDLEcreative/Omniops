import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[id]/members
 * List all members of an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

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

    // Fetch all members with user details
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        id,
        organization_id,
        user_id,
        role,
        invited_by,
        joined_at,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    // Fetch user details for each member using service role to access auth.users
    const serviceSupabase = await createServiceRoleClient();

    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Batch fetch all users to avoid N+1 queries
    const userIds = [...new Set((members || []).map((m: any) => m.user_id))];
    const usersMap = new Map();

    await Promise.all(
      userIds.map(async (userId) => {
        const { data: { user } } = await serviceSupabase.auth.admin.getUserById(userId);
        if (user) usersMap.set(userId, user);
      })
    );

    // Map members with cached user data
    const membersWithDetails = (members || []).map((member: any) => {
      const userData = usersMap.get(member.user_id);
      return {
        ...member,
        email: userData?.email || 'Unknown',
        name: userData?.user_metadata?.name || userData?.user_metadata?.full_name || null,
      };
    });

    return NextResponse.json({
      members: membersWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
