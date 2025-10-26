import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createInvitationSchema } from './validators';
import {
  getOrganizationSeatUsage,
  fetchPendingInvitations,
  checkExistingUserMembership,
  checkExistingInvitation,
  deleteInvitation,
  createInvitation,
} from './services';

/**
 * List pending invitations for an organization
 */
export async function handleGetInvitations(
  request: NextRequest,
  organizationId: string
) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const serviceSupabase = await createServiceRoleClient();
  if (!serviceSupabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  // Fetch seat usage and invitations
  const seatUsage = await getOrganizationSeatUsage(supabase, organizationId);
  const invitationsWithDetails = await fetchPendingInvitations(
    supabase,
    serviceSupabase,
    organizationId
  );

  return NextResponse.json({
    invitations: invitationsWithDetails,
    seat_usage: {
      used: seatUsage.currentMemberCount,
      pending: seatUsage.pendingInvitationCount,
      total: seatUsage.totalUsed,
      limit: seatUsage.seatLimit,
      available: seatUsage.available,
      plan_type: seatUsage.organization?.plan_type || 'free'
    }
  });
}

/**
 * Create a new invitation with seat limit validation
 */
export async function handleCreateInvitation(
  request: NextRequest,
  organizationId: string
) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  // Validate seat limits
  const seatUsage = await getOrganizationSeatUsage(supabase, organizationId);

  if (seatUsage.totalUsed >= seatUsage.seatLimit) {
    return NextResponse.json(
      {
        error: 'Seat limit reached',
        details: {
          message: `Your ${seatUsage.organization?.plan_type} plan allows ${seatUsage.seatLimit} team members. You currently have ${seatUsage.currentMemberCount} members and ${seatUsage.pendingInvitationCount} pending invitations.`,
          current_members: seatUsage.currentMemberCount,
          pending_invitations: seatUsage.pendingInvitationCount,
          seat_limit: seatUsage.seatLimit,
          plan_type: seatUsage.organization?.plan_type,
          upgrade_required: true
        }
      },
      { status: 403 }
    );
  }

  const serviceSupabase = await createServiceRoleClient();
  if (!serviceSupabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  // Check if user already exists and is a member
  const { isExistingMember } = await checkExistingUserMembership(
    supabase,
    serviceSupabase,
    organizationId,
    email
  );

  if (isExistingMember) {
    return NextResponse.json(
      { error: 'User is already a member of this organization' },
      { status: 409 }
    );
  }

  // Check for existing pending invitation
  const invitationCheck = await checkExistingInvitation(
    supabase,
    organizationId,
    email
  );

  if (invitationCheck.hasActiveInvitation) {
    return NextResponse.json(
      { error: 'An active invitation already exists for this email' },
      { status: 409 }
    );
  }

  // Delete expired invitation if exists
  if (invitationCheck.isExpired && invitationCheck.invitationId) {
    await deleteInvitation(supabase, invitationCheck.invitationId);
  }

  // Create invitation
  const { invitation, token } = await createInvitation(
    supabase,
    organizationId,
    email,
    role,
    user.id
  );

  return NextResponse.json(
    {
      invitation,
      invitation_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitations/accept?token=${token}`,
      seat_usage: {
        used: seatUsage.currentMemberCount + 1,
        pending: seatUsage.pendingInvitationCount + 1,
        total: seatUsage.totalUsed + 1,
        limit: seatUsage.seatLimit,
        available: Math.max(0, seatUsage.seatLimit - (seatUsage.totalUsed + 1))
      }
    },
    { status: 201 }
  );
}
