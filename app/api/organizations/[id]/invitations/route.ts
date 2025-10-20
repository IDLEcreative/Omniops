import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
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

    // Fetch inviter details
    const invitationsWithDetails = await Promise.all(
      (invitations || []).map(async (invitation) => {
        const { data: inviterData } = await supabase
          .from('customers')
          .select('email, name')
          .eq('auth_user_id', invitation.invited_by)
          .maybeSingle();

        return {
          ...invitation,
          invited_by_email: inviterData?.email || 'Unknown',
          invited_by_name: inviterData?.name || null,
        };
      })
    );

    return NextResponse.json({
      invitations: invitationsWithDetails,
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
 * Create a new invitation
 */
export async function POST(
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

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('customers')
      .select('auth_user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingMember) {
      const { data: memberCheck } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', existingMember.auth_user_id)
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
