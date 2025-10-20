import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/organizations/[id]/members
 * List all members of an organization
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

    // Fetch user details for each member
    const membersWithDetails = await Promise.all(
      (members || []).map(async (member) => {
        const { data: userData } = await supabase
          .from('customers')
          .select('email, name')
          .eq('auth_user_id', member.user_id)
          .maybeSingle();

        return {
          ...member,
          email: userData?.email || 'Unknown',
          name: userData?.name || null,
        };
      })
    );

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
