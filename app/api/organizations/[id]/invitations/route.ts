import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
});

/**
 * GET /api/organizations/[id]/invitations
 * List pending invitations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { id: organizationId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is member
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

    // Get organization details including seat information
    const { data: organization } = await supabase
      .from('organizations')
      .select('name, seat_limit, plan_type')
      .eq('id', organizationId)
      .single();

    // Count current members
    const { count: currentMemberCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Count pending invitations
    const { count: pendingInvitationCount } = await supabase
      .from('organization_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());

    // Fetch pending invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        organization_id,
        email,
        role,
        token,
        invited_by,
        expires_at,
        accepted_at,
        created_at
      `)
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    // Fetch inviter details using service role to access auth.users
    const serviceSupabase = await createServiceRoleClient();

    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Batch fetch all inviters to avoid N+1 queries
    const inviterIds = [...new Set((invitations || []).map((inv: any) => inv.invited_by))];
    const usersMap = new Map();

    await Promise.all(
      inviterIds.map(async (userId) => {
        const { data: { user } } = await serviceSupabase.auth.admin.getUserById(userId);
        if (user) usersMap.set(userId, user);
      })
    );

    // Map invitations with cached user data
    const invitationsWithDetails = (invitations || []).map((invitation: any) => {
      const inviterUser = usersMap.get(invitation.invited_by);
      return {
        ...invitation,
        invited_by_email: inviterUser?.email || 'Unknown',
        invited_by_name: inviterUser?.user_metadata?.name || inviterUser?.user_metadata?.full_name || null,
      };
    });

    const totalUsed = (currentMemberCount ?? 0) + (pendingInvitationCount ?? 0);
    const seatLimit = organization?.seat_limit ?? 5;

    return NextResponse.json({
      invitations: invitationsWithDetails,
      seat_usage: {
        used: currentMemberCount ?? 0,
        pending: pendingInvitationCount ?? 0,
        total: totalUsed,
        limit: seatLimit,
        available: Math.max(0, seatLimit - totalUsed),
        plan_type: organization?.plan_type || 'free'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/invitations
 * Create a new invitation with seat limit validation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { id: organizationId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or owner
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

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins and owners can invite members' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, role } = validation.data;

    // ===== SEAT LIMIT VALIDATION =====
    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name, seat_limit, plan_type')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Failed to fetch organization details' },
        { status: 500 }
      );
    }

    // Count current members
    const { count: currentMemberCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Count pending invitations (excluding expired ones)
    const { count: pendingInvitationCount } = await supabase
      .from('organization_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());

    const totalSeatsUsed = (currentMemberCount || 0) + (pendingInvitationCount || 0);
    const seatLimit = organization.seat_limit || 5;

    // Check if adding this invitation would exceed the limit
    if (totalSeatsUsed >= seatLimit) {
      return NextResponse.json(
        {
          error: 'Seat limit reached',
          details: {
            message: `Your ${organization.plan_type} plan allows ${seatLimit} team members. You currently have ${currentMemberCount} members and ${pendingInvitationCount} pending invitations.`,
            current_members: currentMemberCount,
            pending_invitations: pendingInvitationCount,
            seat_limit: seatLimit,
            plan_type: organization.plan_type,
            upgrade_required: true
          }
        },
        { status: 403 }
      );
    }

    // Check if user with this email already exists and is a member
    const serviceSupabase = await createServiceRoleClient();

    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Search for user by email with pagination support
    let existingUser = null;
    let page = 1;
    let hasMore = true;

    while (hasMore && !existingUser) {
      const { data: { users }, error: listError } = await serviceSupabase.auth.admin.listUsers({
        page,
        perPage: 1000
      });

      if (listError || !users || users.length === 0) {
        hasMore = false;
      } else {
        existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!existingUser && users.length < 1000) {
          hasMore = false;
        }
        page++;
      }
    }

    if (existingUser) {
      const { data: memberCheck } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (memberCheck) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 409 }
        );
      }
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('organization_invitations')
      .select('id, expires_at')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .is('accepted_at', null)
      .maybeSingle();

    if (existingInvitation) {
      // Check if it's expired
      if (new Date(existingInvitation.expires_at) > new Date()) {
        return NextResponse.json(
          { error: 'An active invitation already exists for this email' },
          { status: 409 }
        );
      }
      // Delete expired invitation
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', existingInvitation.id);
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email,
        role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // TODO: Send email with invitation link
    // const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/accept?token=${token}`;
    // await sendInvitationEmail(email, invitationLink);

    return NextResponse.json(
      {
        invitation,
        // Return invitation link for now (until email is implemented)
        invitation_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitations/accept?token=${token}`,
        seat_usage: {
          used: (currentMemberCount ?? 0) + 1,
          pending: (pendingInvitationCount ?? 0) + 1,
          total: totalSeatsUsed + 1,
          limit: seatLimit,
          available: Math.max(0, seatLimit - (totalSeatsUsed + 1))
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}