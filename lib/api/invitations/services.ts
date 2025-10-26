import { randomBytes } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch organization seat usage and limits
 */
export async function getOrganizationSeatUsage(
  supabase: SupabaseClient,
  organizationId: string
) {
  // Get organization details
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

  const totalUsed = (currentMemberCount ?? 0) + (pendingInvitationCount ?? 0);
  const seatLimit = organization?.seat_limit ?? 5;

  return {
    organization,
    currentMemberCount: currentMemberCount ?? 0,
    pendingInvitationCount: pendingInvitationCount ?? 0,
    totalUsed,
    seatLimit,
    available: Math.max(0, seatLimit - totalUsed),
  };
}

/**
 * Fetch pending invitations with inviter details
 */
export async function fetchPendingInvitations(
  supabase: SupabaseClient,
  serviceSupabase: SupabaseClient,
  organizationId: string
) {
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
    throw new Error(`Failed to fetch invitations: ${invitationsError.message}`);
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
  return (invitations || []).map((invitation: any) => {
    const inviterUser = usersMap.get(invitation.invited_by);
    return {
      ...invitation,
      invited_by_email: inviterUser?.email || 'Unknown',
      invited_by_name: inviterUser?.user_metadata?.name || inviterUser?.user_metadata?.full_name || null,
    };
  });
}

/**
 * Check if user with email already exists and is a member
 */
export async function checkExistingUserMembership(
  supabase: SupabaseClient,
  serviceSupabase: SupabaseClient,
  organizationId: string,
  email: string
) {
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

    return { isExistingMember: !!memberCheck };
  }

  return { isExistingMember: false };
}

/**
 * Check for existing pending invitation
 */
export async function checkExistingInvitation(
  supabase: SupabaseClient,
  organizationId: string,
  email: string
) {
  const { data: existingInvitation } = await supabase
    .from('organization_invitations')
    .select('id, expires_at')
    .eq('organization_id', organizationId)
    .eq('email', email)
    .is('accepted_at', null)
    .maybeSingle();

  if (!existingInvitation) {
    return { hasActiveInvitation: false, invitationId: null };
  }

  // Check if it's expired
  const isExpired = new Date(existingInvitation.expires_at) <= new Date();

  return {
    hasActiveInvitation: !isExpired,
    invitationId: existingInvitation.id,
    isExpired,
  };
}

/**
 * Delete expired invitation
 */
export async function deleteInvitation(
  supabase: SupabaseClient,
  invitationId: string
) {
  await supabase
    .from('organization_invitations')
    .delete()
    .eq('id', invitationId);
}

/**
 * Generate secure invitation token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create invitation expiration date (7 days from now)
 */
export function createExpirationDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

/**
 * Create organization invitation
 */
export async function createInvitation(
  supabase: SupabaseClient,
  organizationId: string,
  email: string,
  role: string,
  invitedBy: string
) {
  const token = generateInvitationToken();
  const expiresAt = createExpirationDate();

  const { data: invitation, error: invitationError } = await supabase
    .from('organization_invitations')
    .insert({
      organization_id: organizationId,
      email,
      role,
      token,
      invited_by: invitedBy,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (invitationError) {
    throw new Error(`Failed to create invitation: ${invitationError.message}`);
  }

  return { invitation, token };
}
